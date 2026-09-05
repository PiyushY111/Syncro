import { inngest, publishAuditLogStep, broadcastSocketEvent } from '../client.js';
import { prisma } from '../../config/prisma.js';
import { updateMeetingInGoogleCalendar, deleteMeetingFromGoogleCalendar } from '../../services/googleCalendarService.js';

export const meetingUpdatedJob = inngest.createFunction(
    { id: 'meeting-updated', event: 'app/meeting.updated' },
    async ({ event, step }) => {
        const { meetingId, previousState, auditContext } = event.data;

        const meeting = await step.run('fetch-meeting', async () => {
            return await prisma.meeting.findUnique({
                where: { id: meetingId },
                include: {
                    creator: { select: { id: true, name: true, email: true } },
                    invites: { include: { user: { select: { id: true, name: true, email: true } } } }
                }
            });
        });

        if (!meeting) return;

        await step.run('google-calendar-sync-update', async () => {
            await updateMeetingInGoogleCalendar({
                userId: meeting.creatorId,
                meeting,
                invites: meeting.invites
            });
        });

        await step.run('websocket-broadcast-meeting-update', async () => {
            broadcastSocketEvent(`workspace:${meeting.workspaceId}`, 'meeting:updated', meeting);
        });

        await publishAuditLogStep(step, {
            workspaceId: meeting.workspaceId,
            userId: meeting.creatorId,
            action: 'UPDATE',
            entityType: 'MEETING',
            entityId: meeting.id,
            entityName: meeting.title,
            previousState,
            newState: meeting,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);

export const meetingDeletedJob = inngest.createFunction(
    { id: 'meeting-deleted', event: 'app/meeting.deleted' },
    async ({ event, step }) => {
        const { meeting, auditContext } = event.data;

        if (meeting.googleEventId) {
            await step.run('google-calendar-sync-delete', async () => {
                await deleteMeetingFromGoogleCalendar({
                    userId: meeting.creatorId,
                    googleEventId: meeting.googleEventId
                });
            });
        }

        await step.run('websocket-broadcast-meeting-delete', async () => {
            broadcastSocketEvent(`workspace:${meeting.workspaceId}`, 'meeting:deleted', { id: meeting.id });
        });

        await publishAuditLogStep(step, {
            workspaceId: meeting.workspaceId,
            userId: meeting.creatorId,
            action: 'DELETE',
            entityType: 'MEETING',
            entityId: meeting.id,
            entityName: meeting.title,
            previousState: meeting,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);
