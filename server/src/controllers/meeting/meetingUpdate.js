import { prisma } from '../../config/prisma.js';
import { executeTransaction } from '../../services/db/dbService.js';
import { eventBus } from '../../services/eventBus.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors/appError.js';

// Update a meeting
export const updateMeeting = asyncHandler(async (req, res) => {
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
        throw new NotFoundError('Meeting not found');
    }

    // Only creator can update
    if (meeting.creatorId !== userId) {
        throw new ForbiddenError('Only the meeting creator can update details');
    }

    const newStart = start_time ? new Date(start_time) : new Date(meeting.start_time);
    const newEnd = end_time ? new Date(end_time) : new Date(meeting.end_time);
    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime()) || newEnd <= newStart) {
        throw new BadRequestError('Meeting end time must be strictly after start time');
    }

    if (projectId) {
        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { workspaceId: true } });
        if (!project || project.workspaceId !== meeting.workspaceId) {
            throw new NotFoundError('Project not found');
        }
    }

    if (invitees && Array.isArray(invitees)) {
        const otherInviteeIds = invitees.filter((guestId) => guestId !== meeting.creatorId);
        if (otherInviteeIds.length > 0) {
            const memberInvitees = await prisma.workspaceMember.findMany({
                where: { workspaceId: meeting.workspaceId, userId: { in: otherInviteeIds } },
                select: { userId: true }
            });
            if (memberInvitees.length !== new Set(otherInviteeIds).size) {
                throw new BadRequestError('One or more invitees are not members of this workspace');
            }
        }
    }

    const previousState = await prisma.meeting.findUnique({
        where: { id },
        include: { invites: true }
    });

    const fullMeeting = await executeTransaction(async (tx) => {
        await tx.meeting.update({
            where: { id },
            data: {
                title: title !== undefined ? title.trim() : meeting.title,
                description: description !== undefined ? (description?.trim() || null) : meeting.description,
                agenda: agenda !== undefined ? (agenda?.trim() || null) : meeting.agenda,
                start_time: newStart,
                end_time: newEnd,
                meetingLink: meetingLink !== undefined ? (meetingLink?.trim() || null) : meeting.meetingLink,
                location: location !== undefined ? (location?.trim() || null) : meeting.location,
                projectId: projectId !== undefined ? (projectId || null) : meeting.projectId
            }
        });

        if (invitees && Array.isArray(invitees)) {
            const uniqueInvitees = Array.from(new Set([meeting.creatorId, ...invitees]));

            await tx.meetingInvite.deleteMany({
                where: {
                    meetingId: id,
                    userId: {
                        notIn: uniqueInvitees,
                        not: meeting.creatorId
                    }
                }
            });

            await tx.meetingInvite.createMany({
                data: uniqueInvitees.map((guestId) => ({
                    meetingId: id,
                    userId: guestId,
                    status: guestId === meeting.creatorId ? 'ACCEPTED' : 'PENDING'
                })),
                skipDuplicates: true
            });
        }

        return await tx.meeting.findUnique({
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
    });

    await eventBus.publish('app/meeting.updated', {
        meetingId: id,
        previousState,
        auditContext: {
            workspaceId: meeting.workspaceId,
            userId,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.json({ message: 'Meeting updated successfully', meeting: fullMeeting });
});

// Cancel/Delete a meeting
export const deleteMeeting = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if meeting exists
    const meeting = await prisma.meeting.findUnique({
        where: { id }
    });

    if (!meeting) {
        throw new NotFoundError('Meeting not found');
    }

    // Only creator can delete
    if (meeting.creatorId !== userId) {
        throw new ForbiddenError('Only the meeting creator can cancel the meeting');
    }

    const previousState = { ...meeting };

    await prisma.meeting.delete({
        where: { id }
    });

    await eventBus.publish('app/meeting.deleted', {
        meeting,
        auditContext: {
            workspaceId: meeting.workspaceId,
            userId,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.json({ message: 'Meeting cancelled successfully', meetingId: id });
});
