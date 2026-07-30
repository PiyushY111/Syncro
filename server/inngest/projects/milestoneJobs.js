import { inngest, publishAuditLogStep } from '../client.js';

export const milestoneCreatedJob = inngest.createFunction(
    { id: 'milestone-created' },
    { event: 'app/milestone.created' },
    async ({ event, step }) => {
        const { milestone, workspaceId, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'CREATE',
            entityType: 'MILESTONE',
            entityId: milestone.id,
            entityName: milestone.title,
            newState: milestone,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);

export const milestoneUpdatedJob = inngest.createFunction(
    { id: 'milestone-updated' },
    { event: 'app/milestone.updated' },
    async ({ event, step }) => {
        const { milestone, previousState, workspaceId, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'UPDATE',
            entityType: 'MILESTONE',
            entityId: milestone.id,
            entityName: milestone.title,
            previousState,
            newState: milestone,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);

export const milestoneDeletedJob = inngest.createFunction(
    { id: 'milestone-deleted' },
    { event: 'app/milestone.deleted' },
    async ({ event, step }) => {
        const { milestoneId, milestoneName, workspaceId, previousState, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'DELETE',
            entityType: 'MILESTONE',
            entityId: milestoneId,
            entityName: milestoneName,
            previousState,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);
