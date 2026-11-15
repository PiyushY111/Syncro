import { inngest } from '../client.js';
import { logAuditEvent } from '../../services/auditLogger.js';

export const auditLogJob = inngest.createFunction(
    { id: 'audit-logger', event: 'app/audit.log' },
    async ({ event }) => {
        const {
            workspaceId,
            userId,
            action,
            entityType,
            entityId,
            entityName,
            severity,
            previousState,
            newState,
            ipAddress,
            userAgent
        } = event.data;

        await logAuditEvent({
            workspaceId,
            userId,
            action,
            entityType,
            entityId,
            entityName,
            severity,
            previousState,
            newState,
            ipAddress,
            userAgent
        });
    }
);
