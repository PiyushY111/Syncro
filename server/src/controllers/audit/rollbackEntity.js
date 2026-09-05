import { prisma } from "../../config/prisma.js";
import { logAuditEvent } from "../../services/auditLogger.js";
import { getUserWorkspaceRole } from "../role/checkPermissionHelper.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";

export const rollbackEntity = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { logId } = req.body;

    if (!logId) throw new BadRequestError("logId is required");

    const targetLog = await prisma.auditLog.findUnique({
        where: { id: logId }
    });

    if (!targetLog) throw new NotFoundError("Audit log entry not found");

    const { isOwner, role } = await getUserWorkspaceRole(userId, targetLog.workspaceId);
    if (!isOwner && role !== "ADMIN") {
        throw new ForbiddenError("Only Owner or Admin can execute a time-travel rollback.");
    }

    const details = typeof targetLog.details === "object" && targetLog.details ? targetLog.details : {};
    const previousState = details.previousState || details.newState;

    if (!previousState || Object.keys(previousState).length === 0) {
        throw new BadRequestError("No snapshot available for rollback");
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
});
