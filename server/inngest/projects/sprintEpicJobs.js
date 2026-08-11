import { inngest, publishAuditLogStep } from '../client.js';

export const sprintCreatedJob = inngest.createFunction(
    { id: 'sprint-created', event: 'app/sprint.created' },
    async ({ event, step }) => {
        const { sprint, workspaceId, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'CREATE',
            entityType: 'PROJECT',
            entityId: sprint.id,
            entityName: sprint.name,
            newState: sprint,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);

export const sprintUpdatedJob = inngest.createFunction(
    { id: 'sprint-updated', event: 'app/sprint.updated' },
    async ({ event, step }) => {
        const { sprint, previousState, workspaceId, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'UPDATE',
            entityType: 'PROJECT',
            entityId: sprint.id,
            entityName: sprint.name,
            previousState,
            newState: sprint,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);

export const sprintDeletedJob = inngest.createFunction(
    { id: 'sprint-deleted', event: 'app/sprint.deleted' },
    async ({ event, step }) => {
        const { sprintId, sprintName, workspaceId, previousState, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'DELETE',
            entityType: 'PROJECT',
            entityId: sprintId,
            entityName: sprintName,
            previousState,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);

export const epicCreatedJob = inngest.createFunction(
    { id: 'epic-created', event: 'app/epic.created' },
    async ({ event, step }) => {
        const { epic, workspaceId, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'CREATE',
            entityType: 'PROJECT',
            entityId: epic.id,
            entityName: epic.name,
            newState: epic,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);

export const epicUpdatedJob = inngest.createFunction(
    { id: 'epic-updated', event: 'app/epic.updated' },
    async ({ event, step }) => {
        const { epic, previousState, workspaceId, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'UPDATE',
            entityType: 'PROJECT',
            entityId: epic.id,
            entityName: epic.name,
            previousState,
            newState: epic,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);

export const epicDeletedJob = inngest.createFunction(
    { id: 'epic-deleted', event: 'app/epic.deleted' },
    async ({ event, step }) => {
        const { epicId, epicName, workspaceId, previousState, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'DELETE',
            entityType: 'PROJECT',
            entityId: epicId,
            entityName: epicName,
            previousState,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);
