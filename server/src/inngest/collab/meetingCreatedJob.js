import { inngest, publishAuditLogStep, broadcastSocketEvent } from '../client.js';
import { prisma } from '../../config/prisma.js';
import { pushMeetingToGoogleCalendar } from '../../services/googleCalendarService.js';
import sendEmail from '../../config/nodemailer.js';

export const meetingCreatedJob = inngest.createFunction(
    { id: 'meeting-created', event: 'app/meeting.created' },
    async ({ event, step }) => {
        const { meetingId, creatorId, inviteeIds, auditContext } = event.data;

        const meeting = await step.run('fetch-meeting-details', async () => {
            return await prisma.meeting.findUnique({
                where: { id: meetingId },
                include: {
                    creator: { select: { id: true, name: true, email: true } },
                    project: { select: { id: true, name: true } },
                    invites: { include: { user: { select: { id: true, name: true, email: true } } } }
                }
            });
        });

        if (!meeting) return;

        const gcalResult = await step.run('google-calendar-sync', async () => {
            return await pushMeetingToGoogleCalendar({
                userId: creatorId,
                meeting,
                invites: meeting.invites
            });
        });

        if (gcalResult) {
            await step.run('update-meeting-with-gcal', async () => {
                const updateData = {};
                if (gcalResult.googleEventId) updateData.googleEventId = gcalResult.googleEventId;
                if (gcalResult.meetingLink && !meeting.meetingLink) updateData.meetingLink = gcalResult.meetingLink;

                if (Object.keys(updateData).length > 0) {
                    await prisma.meeting.update({
                        where: { id: meetingId },
                        data: updateData
                    });
                }
            });
        }

        for (const inviteeId of inviteeIds) {
            if (inviteeId === creatorId) continue;

            const inviteeUser = meeting.invites.find(inv => inv.userId === inviteeId)?.user;
            if (!inviteeUser) continue;

            await step.run(`create-invite-notification-${inviteeId}`, async () => {
                const notification = await prisma.notification.create({
                    data: {
                        userId: inviteeId,
                        workspaceId: meeting.workspaceId,
                        type: 'MEETING_INVITE',
                        title: `New Meeting Scheduled`,
                        content: `You have been invited to: ${meeting.title} by ${meeting.creator.name}. Starts at ${new Date(meeting.start_time).toLocaleString()}`,
                        entityType: 'MEETING',
                        entityId: meeting.id,
                        priority: 'MEDIUM'
                    }
                });
                broadcastSocketEvent(`user:${inviteeId}`, 'notification:received', notification);
            });

            await step.run(`send-invite-email-${inviteeId}`, async () => {
                await sendEmail({
                    to: inviteeUser.email,
                    subject: `Meeting Invitation: ${meeting.title}`,
                    text: `You have been invited to a meeting scheduled by ${meeting.creator.name}. Details:\nTitle: ${meeting.title}\nTime: ${new Date(meeting.start_time).toLocaleString()}\nLink: ${meeting.meetingLink || 'N/A'}`,
                    html: `<h3>Meeting Invitation</h3><p>You have been invited to a meeting scheduled by <strong>${meeting.creator.name}</strong>.</p><ul><li><strong>Title:</strong> ${meeting.title}</li><li><strong>Time:</strong> ${new Date(meeting.start_time).toLocaleString()}</li><li><strong>Join Link:</strong> <a href="${meeting.meetingLink}">${meeting.meetingLink || 'N/A'}</a></li></ul>`
                });
            });
        }

        await step.run('websocket-broadcast-meeting', async () => {
            broadcastSocketEvent(`workspace:${meeting.workspaceId}`, 'meeting:created', meeting);
        });

        await publishAuditLogStep(step, {
            workspaceId: meeting.workspaceId,
            userId: creatorId,
            action: 'CREATE',
            entityType: 'MEETING',
            entityId: meeting.id,
            entityName: meeting.title,
            newState: meeting,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);
