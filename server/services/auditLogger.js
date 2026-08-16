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
