import { prisma } from '../../config/prisma.js';
import { updateMeetingInGoogleCalendar, deleteMeetingFromGoogleCalendar } from '../../services/googleCalendarService.js';
import { logAuditEvent } from '../../services/auditLogger.js';

// Update a meeting
export const updateMeeting = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const {
            title,
            description,
            agenda,
            start_time,
            end_time,
            meetingLink,
            location,
            projectId,
            invitees // Array of user IDs
        } = req.body;

        // Check if meeting exists
        const meeting = await prisma.meeting.findUnique({
            where: { id },
            include: { invites: true }
        });

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Only creator can update
        if (meeting.creatorId !== userId) {
            return res.status(403).json({ message: 'Only the meeting creator can update details' });
        }

        const previousState = await prisma.meeting.findUnique({
            where: { id },
            include: { invites: true }
        });

        // Update basic details
        const updatedMeeting = await prisma.meeting.update({
            where: { id },
            data: {
                title: title !== undefined ? title.trim() : meeting.title,
                description: description !== undefined ? (description?.trim() || null) : meeting.description,
                agenda: agenda !== undefined ? (agenda?.trim() || null) : meeting.agenda,
                start_time: start_time ? new Date(start_time) : meeting.start_time,
                end_time: end_time ? new Date(end_time) : meeting.end_time,
                meetingLink: meetingLink !== undefined ? (meetingLink?.trim() || null) : meeting.meetingLink,
                location: location !== undefined ? (location?.trim() || null) : meeting.location,
                projectId: projectId !== undefined ? (projectId || null) : meeting.projectId
            }
        });

        // Update guest invites if provided
        if (invitees && Array.isArray(invitees)) {
            const uniqueInvitees = Array.from(new Set([meeting.creatorId, ...invitees]));

            // Delete invites that are not in the new invitees list (exclude the creator)
            await prisma.meetingInvite.deleteMany({
                where: {
                    meetingId: id,
                    userId: {
                        notIn: uniqueInvitees,
                        not: meeting.creatorId
                    }
                }
            });

            // Add new invites
            await prisma.meetingInvite.createMany({
                data: uniqueInvitees.map((guestId) => ({
                    meetingId: id,
                    userId: guestId,
                    status: guestId === meeting.creatorId ? 'ACCEPTED' : 'PENDING'
                })),
                skipDuplicates: true
            });
        }

        // Retrieve full updated meeting
        const fullMeeting = await prisma.meeting.findUnique({
            where: { id },
            include: {
                creator: {
                    select: { id: true, name: true, email: true, image: true }
                },
                project: {
                    select: { id: true, name: true }
                },
                invites: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, image: true }
                        }
                    }
                }
            }
        });

        // Update Google Calendar if synced
        if (fullMeeting.googleEventId) {
            try {
                await updateMeetingInGoogleCalendar({
                    userId,
                    meeting: fullMeeting,
                    invites: fullMeeting.invites
                });
            } catch (gcalErr) {
                console.error('[Google Calendar Update Error]', gcalErr);
            }
        }

        await logAuditEvent({
            workspaceId: meeting.workspaceId,
            userId,
            action: "UPDATE",
            entityType: "MEETING",
            entityId: id,
            entityName: fullMeeting.title,
            previousState,
            newState: fullMeeting,
            req
        });

        return res.json({ message: 'Meeting updated successfully', meeting: fullMeeting });
    } catch (error) {
        console.error('Error in updateMeeting:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Cancel/Delete a meeting
export const deleteMeeting = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Check if meeting exists
        const meeting = await prisma.meeting.findUnique({
            where: { id }
        });

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Only creator can delete
        if (meeting.creatorId !== userId) {
            return res.status(403).json({ message: 'Only the meeting creator can cancel the meeting' });
        }

        // Delete from Google Calendar if synced
        if (meeting.googleEventId) {
            try {
                await deleteMeetingFromGoogleCalendar({
                    userId,
                    googleEventId: meeting.googleEventId
                });
            } catch (gcalErr) {
                console.error('[Google Calendar Delete Error]', gcalErr);
            }
        }

        const previousState = { ...meeting };

        await prisma.meeting.delete({
            where: { id }
        });

        await logAuditEvent({
            workspaceId: meeting.workspaceId,
            userId,
            action: "DELETE",
            entityType: "MEETING",
            entityId: id,
            entityName: meeting.title,
            previousState,
            req
        });

        return res.json({ message: 'Meeting cancelled successfully', meetingId: id });
    } catch (error) {
        console.error('Error in deleteMeeting:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
