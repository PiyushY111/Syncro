import { inngest, publishAuditLogStep, broadcastSocketEvent } from '../client.js';

export const projectCreatedJob = inngest.createFunction(
    { id: 'project-created' },
    { event: 'app/project.created' },
    async ({ event, step }) => {
        const { project, workspaceId, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'CREATE',
            entityType: 'PROJECT',
            entityId: project.id,
            entityName: project.name,
            newState: project,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });

        await step.run('websocket-broadcast', async () => {
            broadcastSocketEvent(`workspace:${workspaceId}`, 'project:created', project);
        });
    }
);

export const projectUpdatedJob = inngest.createFunction(
    { id: 'project-updated' },
    { event: 'app/project.updated' },
    async ({ event, step }) => {
        const { project, previousState, workspaceId, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'UPDATE',
            entityType: 'PROJECT',
            entityId: project.id,
            entityName: project.name,
            previousState,
            newState: project,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });

        await step.run('websocket-broadcast', async () => {
            broadcastSocketEvent(`workspace:${workspaceId}`, 'project:updated', project);
        });
    }
);

export const projectDeletedJob = inngest.createFunction(
    { id: 'project-deleted' },
    { event: 'app/project.deleted' },
    async ({ event, step }) => {
        const { projectId, projectName, workspaceId, previousState, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'DELETE',
            entityType: 'PROJECT',
            entityId: projectId,
            entityName: projectName,
            previousState,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });

        await step.run('websocket-broadcast', async () => {
            broadcastSocketEvent(`workspace:${workspaceId}`, 'project:deleted', { id: projectId });
        });
    }
);
