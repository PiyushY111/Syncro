import { inngest, publishAuditLogStep, broadcastSocketEvent } from '../client.js';
import sendEmail from '../../config/nodemailer.js';

export const workspaceMemberInvitedJob = inngest.createFunction(
    { id: 'workspace-member-invited', event: 'app/workspace.member_invited' },
    async ({ event, step }) => {
        const { email, subject, text, html } = event.data;

        await step.run('send-invite-email', async () => {
            await sendEmail({ to: email, subject, text, html });
        });
    }
);

export const workspaceMemberRoleChangedJob = inngest.createFunction(
    { id: 'workspace-member-role-changed', event: 'app/workspace.member_role_changed' },
    async ({ event, step }) => {
        const { workspaceId, targetUserId, targetUserName, previousRole, newRole, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'ROLE_CHANGE',
            entityType: 'USER',
            entityId: targetUserId,
            entityName: targetUserName,
            severity: 'CRITICAL',
            previousState: { role: previousRole },
            newState: { role: newRole },
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });

        await step.run('websocket-broadcast', async () => {
            broadcastSocketEvent(`workspace:${workspaceId}`, 'workspace:member_role_changed', {
                targetUserId,
                newRole
            });
        });
    }
);
