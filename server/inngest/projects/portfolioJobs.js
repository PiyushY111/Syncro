import { inngest, publishAuditLogStep } from '../client.js';

export const portfolioCreatedJob = inngest.createFunction(
    { id: 'portfolio-created' },
    { event: 'app/portfolio.created' },
    async ({ event, step }) => {
        const { portfolio, workspaceId, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'CREATE',
            entityType: 'PORTFOLIO',
            entityId: portfolio.id,
            entityName: portfolio.name,
            newState: portfolio,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);

export const portfolioUpdatedJob = inngest.createFunction(
    { id: 'portfolio-updated' },
    { event: 'app/portfolio.updated' },
    async ({ event, step }) => {
        const { portfolio, previousState, workspaceId, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'UPDATE',
            entityType: 'PORTFOLIO',
            entityId: portfolio.id,
            entityName: portfolio.name,
            previousState,
            newState: portfolio,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);

export const portfolioDeletedJob = inngest.createFunction(
    { id: 'portfolio-deleted' },
    { event: 'app/portfolio.deleted' },
    async ({ event, step }) => {
        const { portfolioId, portfolioName, workspaceId, previousState, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId,
            userId: auditContext.userId,
            action: 'DELETE',
            entityType: 'PORTFOLIO',
            entityId: portfolioId,
            entityName: portfolioName,
            previousState,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });
    }
);
