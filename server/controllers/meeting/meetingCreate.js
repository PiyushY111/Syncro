import { prisma } from '../../config/prisma.js';
import { executeTransaction } from '../../services/db/dbService.js';
import { eventBus } from '../../services/eventBus.js';

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

        const start = new Date(start_time);
        const end = new Date(end_time);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
            return res.status(400).json({ message: 'Meeting end time must be strictly after start time' });
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

        const uniqueInvitees = Array.from(new Set([creatorId, ...(Array.isArray(invitees) ? invitees : [])]));

        // Create the meeting and invites atomically inside a transaction
        const fullMeeting = await executeTransaction(async (tx) => {
            const created = await tx.meeting.create({
                data: {
                    title: title.trim(),
                    description: description.trim() || null,
                    agenda: agenda.trim() || null,
                    start_time: start,
                    end_time: end,
                    meetingLink: meetingLink.trim() || null,
                    location: location.trim() || null,
                    workspaceId,
                    projectId: projectId || null,
                    creatorId
                }
            });

            await tx.meetingInvite.createMany({
                data: uniqueInvitees.map((userId) => ({
                    meetingId: created.id,
                    userId,
                    status: userId === creatorId ? 'ACCEPTED' : 'PENDING'
                })),
                skipDuplicates: true
            });

            return await tx.meeting.findUnique({
                where: { id: created.id },
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

        await eventBus.publish('app/meeting.created', {
            meetingId: fullMeeting.id,
            creatorId,
            inviteeIds: uniqueInvitees,
            auditContext: {
                workspaceId,
                userId: creatorId,
                ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                userAgent: req.headers["user-agent"]
            }
        });

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
