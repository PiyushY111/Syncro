import { prisma } from "../config/prisma.js";

export const logAuditEvent = async ({
    workspaceId,
    userId,
    action = "UPDATE",
    entityType = "TASK",
    entityId = null,
    entityName = "",
    severity = null,
    previousState = null,
    newState = null,
    req = null
}) => {
    try {
        if (!workspaceId || !userId) return null;

        let autoSeverity = severity;
        if (!autoSeverity) {
            if (action === "DELETE" || action === "ROLE_CHANGE" || action === "ROLLBACK") {
                autoSeverity = "CRITICAL";
            } else if (action === "UPDATE") {
                autoSeverity = "WARNING";
            } else {
                autoSeverity = "INFO";
            }
        }

        const ipAddress = req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || "127.0.0.1";
        const userAgent = req?.headers?.["user-agent"] || "System";

        const logEntry = await prisma.auditLog.create({
            data: {
                workspaceId,
                userId,
                action,
                severity: autoSeverity,
                entityType,
                entityId,
                entityName,
                details: {
                    previousState: previousState || {},
                    newState: newState || {},
                    ipAddress,
                    userAgent
                }
            }
        });

        return logEntry;
    } catch (error) {
        console.error("Error logging audit event:", error);
        return null;
    }
};
