import { prisma } from '../../config/prisma.js';
import { pushMeetingToGoogleCalendar } from '../../services/googleCalendarService.js';

// Create a meeting and send invites
export const createMeeting = async (req, res) => {
    try {
        const creatorId = req.user.id;
        const {
            workspaceId,
            projectId,
            title,
            description = '',
            agenda = '',
            start_time,
            end_time,
            meetingLink = '',
            location = '',
            invitees = [] // Array of user IDs
        } = req.body;

        if (!workspaceId) {
            return res.status(400).json({ message: 'workspaceId is required' });
        }
        if (!title?.trim()) {
            return res.status(400).json({ message: 'Meeting title is required' });
        }
        if (!start_time || !end_time) {
            return res.status(400).json({ message: 'Start time and end time are required' });
        }

        // Verify workspace membership
        const membership = await prisma.workspaceMember.findUnique({
            where: {
                userId_workspaceId: {
                    userId: creatorId,
                    workspaceId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({ message: 'You are not a member of this workspace' });
        }

        // Create the meeting
        const meeting = await prisma.meeting.create({
            data: {
                title: title.trim(),
                description: description.trim() || null,
                agenda: agenda.trim() || null,
                start_time: new Date(start_time),
                end_time: new Date(end_time),
                meetingLink: meetingLink.trim() || null,
                location: location.trim() || null,
                workspaceId,
                projectId: projectId || null,
                creatorId
            }
        });

        // Setup invites: Creator is automatically invited and ACCEPTED.
        // Other invitees are PENDING.
        const uniqueInvitees = Array.from(new Set([creatorId, ...invitees]));
        
        await prisma.meetingInvite.createMany({
            data: uniqueInvitees.map((userId) => ({
                meetingId: meeting.id,
                userId,
                status: userId === creatorId ? 'ACCEPTED' : 'PENDING'
            })),
            skipDuplicates: true
        });

        // Retrieve full meeting with details
        const fullMeeting = await prisma.meeting.findUnique({
            where: { id: meeting.id },
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

        // Push to Google Calendar if creator has active Google Calendar sync
        try {
            const gcalResult = await pushMeetingToGoogleCalendar({
                userId: creatorId,
                meeting: fullMeeting,
                invites: fullMeeting.invites
            });

            if (gcalResult) {
                const updateData = {};
                if (gcalResult.googleEventId) updateData.googleEventId = gcalResult.googleEventId;
                if (gcalResult.meetingLink && !fullMeeting.meetingLink) updateData.meetingLink = gcalResult.meetingLink;

                if (Object.keys(updateData).length > 0) {
                    await prisma.meeting.update({
                        where: { id: meeting.id },
                        data: updateData
                    });
                    if (updateData.googleEventId) fullMeeting.googleEventId = updateData.googleEventId;
                    if (updateData.meetingLink) fullMeeting.meetingLink = updateData.meetingLink;
                }
            }
        } catch (gcalErr) {
            console.error('[Google Calendar Push Error]', gcalErr);
        }

        return res.status(201).json({ message: 'Meeting scheduled successfully', meeting: fullMeeting });
    } catch (error) {
        console.error('Error in createMeeting:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all meetings in a workspace
export const getWorkspaceMeetings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId } = req.query;

        if (!workspaceId) {
            return res.status(400).json({ message: 'workspaceId is required' });
        }

        // Verify workspace membership
        const membership = await prisma.workspaceMember.findUnique({
            where: {
                userId_workspaceId: {
                    userId,
                    workspaceId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({ message: 'Access denied: not a member of this workspace' });
        }

        const meetings = await prisma.meeting.findMany({
            where: { workspaceId },
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
            },
            orderBy: { start_time: 'asc' }
        });

        return res.json({ meetings });
    } catch (error) {
        console.error('Error in getWorkspaceMeetings:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
