import { prisma } from "../../config/prisma.js";
import { logAuditEvent } from "../../services/auditLogger.js";
import { getUserWorkspaceRole } from "../role/checkPermissionHelper.js";

export const rollbackEntity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { logId } = req.body;

        if (!logId) return res.status(400).json({ message: "logId is required" });

        const targetLog = await prisma.auditLog.findUnique({
            where: { id: logId }
        });

        if (!targetLog) return res.status(404).json({ message: "Audit log entry not found" });

        const { isOwner, role } = await getUserWorkspaceRole(userId, targetLog.workspaceId);
        if (!isOwner && role !== "ADMIN") {
            return res.status(403).json({ message: "Only Owner or Admin can execute a time-travel rollback." });
        }

        const details = typeof targetLog.details === "object" && targetLog.details ? targetLog.details : {};
        const previousState = details.previousState || details.newState;

        if (!previousState || Object.keys(previousState).length === 0) {
            return res.status(400).json({ message: "No snapshot available for rollback" });
        }

        let restoredItem = null;

        if (targetLog.entityType === "TASK" && targetLog.entityId) {
            const allowedTaskFields = ["title", "description", "status", "priority", "due_date", "assigneeId"];
            const cleanData = {};
            allowedTaskFields.forEach(f => { if (previousState[f] !== undefined) cleanData[f] = previousState[f]; });

            restoredItem = await prisma.task.update({
                where: { id: targetLog.entityId },
                data: cleanData
            });
        } else if (targetLog.entityType === "PROJECT" && targetLog.entityId) {
            const allowedProjFields = ["name", "description", "status", "priority", "start_date", "end_date"];
            const cleanData = {};
            allowedProjFields.forEach(f => { if (previousState[f] !== undefined) cleanData[f] = previousState[f]; });

            restoredItem = await prisma.project.update({
                where: { id: targetLog.entityId },
                data: cleanData
            });
        }

        await logAuditEvent({
            workspaceId: targetLog.workspaceId,
            userId,
            action: "ROLLBACK",
            entityType: targetLog.entityType,
            entityId: targetLog.entityId,
            entityName: targetLog.entityName,
            severity: "CRITICAL",
            newState: restoredItem || previousState,
            req
        });

        return res.status(200).json({ message: "Entity successfully rolled back to target version", restoredItem });
    } catch (error) {
        console.error("Error executing entity rollback:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
