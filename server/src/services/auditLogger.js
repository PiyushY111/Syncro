import crypto from "crypto";
import { basePrisma } from "../config/prisma.js";

/**
 * Creates a tamper-evident, append-only audit log record chained via SHA-256 hashes.
 */
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
    ipAddress = null,
    userAgent = null,
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

        const ip = ipAddress || req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || "127.0.0.1";
        const ua = userAgent || req?.headers?.["user-agent"] || "System";

        const details = {
            previousState: previousState || {},
            newState: newState || {},
            ipAddress: ip,
            userAgent: ua
        };

        // Fetch last audit log for this workspace to retrieve previous hash for cryptographic chaining
        const lastLog = await basePrisma.auditLog.findFirst({
            where: { workspaceId },
            orderBy: { createdAt: "desc" },
            select: { hash: true }
        });

        const prevHash = lastLog?.hash ?? "GENESIS";
        const payloadString = `${prevHash}:${workspaceId}:${userId}:${action}:${entityType}:${entityId || ''}:${JSON.stringify(details)}`;
        const hash = crypto.createHash("sha256").update(payloadString).digest("hex");

        const logEntry = await basePrisma.auditLog.create({
            data: {
                workspaceId,
                userId,
                action,
                severity: autoSeverity,
                entityType,
                entityId,
                entityName,
                details,
                prevHash,
                hash
            }
        });

        return logEntry;
    } catch (error) {
        console.error("Error logging audit event:", error);
        return null;
    }
};

/**
 * Cryptographically verifies the SHA-256 hash chain of audit logs for a workspace.
 *
 * @param {string} workspaceId
 * @returns {Promise<{ isValid: boolean, corruptedLogId?: string, totalLogs: number }>}
 */
export const verifyAuditLogChain = async (workspaceId) => {
    try {
        const logs = await basePrisma.auditLog.findMany({
            where: { workspaceId },
            orderBy: { createdAt: "asc" }
        });

        let expectedPrevHash = "GENESIS";
        for (const log of logs) {
            if (log.prevHash !== expectedPrevHash) {
                return { isValid: false, corruptedLogId: log.id, totalLogs: logs.length, reason: "Previous hash mismatch" };
            }

            const details = log.details || {};
            const payloadString = `${log.prevHash}:${log.workspaceId}:${log.userId}:${log.action}:${log.entityType}:${log.entityId || ''}:${JSON.stringify(details)}`;
            const computedHash = crypto.createHash("sha256").update(payloadString).digest("hex");

            if (log.hash !== computedHash) {
                return { isValid: false, corruptedLogId: log.id, totalLogs: logs.length, reason: "Payload hash tampered" };
            }

            expectedPrevHash = log.hash;
        }

        return { isValid: true, totalLogs: logs.length };
    } catch (error) {
        console.error("Error verifying audit log chain:", error);
        return { isValid: false, totalLogs: 0, error: error.message };
    }
};

