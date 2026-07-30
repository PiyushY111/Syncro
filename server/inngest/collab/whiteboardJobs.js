import { inngest, publishAuditLogStep, broadcastSocketEvent } from '../client.js';

export const whiteboardCreatedJob = inngest.createFunction(
    { id: 'whiteboard-created' },
    { event: 'app/whiteboard.created' },
    async ({ event, step }) => {
        const { whiteboard, workspaceId, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'CREATE',
            entityType: 'WHITEBOARD',
            entityId: whiteboard.id,
            entityName: whiteboard.name,
            newState: whiteboard,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);

export const whiteboardUpdatedJob = inngest.createFunction(
    { id: 'whiteboard-updated' },
    { event: 'app/whiteboard.updated' },
    async ({ event, step }) => {
        const { whiteboard, previousState, workspaceId, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'UPDATE',
            entityType: 'WHITEBOARD',
            entityId: whiteboard.id,
            entityName: whiteboard.name,
            previousState,
            newState: whiteboard,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });

        await step.run('websocket-broadcast-whiteboard-update', async () => {
            broadcastSocketEvent(`whiteboard:${whiteboard.id}`, 'whiteboard:updated', whiteboard);
        });
    }
);

export const whiteboardDeletedJob = inngest.createFunction(
    { id: 'whiteboard-deleted' },
    { event: 'app/whiteboard.deleted' },
    async ({ event, step }) => {
        const { whiteboardId, whiteboardName, workspaceId, previousState, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'DELETE',
            entityType: 'WHITEBOARD',
            entityId: whiteboardId,
            entityName: whiteboardName,
            previousState,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });

        await step.run('websocket-broadcast-whiteboard-delete', async () => {
            broadcastSocketEvent(`workspace:${workspaceId}`, 'whiteboard:deleted', { id: whiteboardId });
        });
    }
);
