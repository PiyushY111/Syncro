import { inngest, publishAuditLogStep } from '../client.js';

export const subTeamCreatedJob = inngest.createFunction(
    { id: 'subteam-created' },
    { event: 'app/subteam.created' },
    async ({ event, step }) => {
        const { subTeam, workspaceId, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'CREATE',
            entityType: 'SUBTEAM',
            entityId: subTeam.id,
            entityName: subTeam.name,
            newState: subTeam,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);

export const subTeamUpdatedJob = inngest.createFunction(
    { id: 'subteam-updated' },
    { event: 'app/subteam.updated' },
    async ({ event, step }) => {
        const { subTeam, previousState, workspaceId, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'UPDATE',
            entityType: 'SUBTEAM',
            entityId: subTeam.id,
            entityName: subTeam.name,
            previousState,
            newState: subTeam,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);

export const subTeamDeletedJob = inngest.createFunction(
    { id: 'subteam-deleted' },
    { event: 'app/subteam.deleted' },
    async ({ event, step }) => {
        const { subTeamId, subTeamName, workspaceId, previousState, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'DELETE',
            entityType: 'SUBTEAM',
            entityId: subTeamId,
            entityName: subTeamName,
            previousState,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);

export const subTeamMemberAddedJob = inngest.createFunction(
    { id: 'subteam-member-added' },
    { event: 'app/subteam.member_added' },
    async ({ event, step }) => {
        const { subTeamId, subTeamName, workspaceId, membership, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'UPDATE',
            entityType: 'SUBTEAM',
            entityId: subTeamId,
            entityName: `${subTeamName} - Add member ${membership.user?.name || membership.userId}`,
            newState: membership,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);

export const subTeamMemberRemovedJob = inngest.createFunction(
    { id: 'subteam-member-removed' },
    { event: 'app/subteam.member_removed' },
    async ({ event, step }) => {
        const { subTeamId, subTeamName, workspaceId, targetUserId, targetUserName, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'UPDATE',
            entityType: 'SUBTEAM',
            entityId: subTeamId,
            entityName: `${subTeamName} - Remove member ${targetUserName || targetUserId}`,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);
