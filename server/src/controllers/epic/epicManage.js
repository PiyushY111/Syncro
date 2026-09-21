import { prisma } from "../../config/prisma.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/response/apiResponse.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";
import logger from "../../utils/logger/logger.js";

const canManageEpics = async (userId, workspaceId) => {
    return await hasWorkspacePermission(userId, workspaceId, "editTasks");
};

export const updateEpic = asyncHandler(async (req, res) => {
    const { epicId } = req.params;
    const { name, description, color } = req.body;

    const epic = await prisma.epic.findUnique({
        where: { id: epicId },
        include: { project: true }
    });

    if (!epic) {
        throw new NotFoundError("Epic not found");
    }

    const hasPermission = await canManageEpics(req.user.id, epic.project.workspaceId);
    if (!hasPermission) {
        throw new ForbiddenError("You do not have permission to edit Epics");
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : "";
    if (color !== undefined) updateData.color = color;

    const updatedEpic = await prisma.epic.update({
        where: { id: epicId },
        data: updateData
    });

    await eventBus.publish('app/epic.updated', {
        epic: updatedEpic,
        previousState: epic,
        workspaceId: epic.project.workspaceId,
        auditContext: {
            workspaceId: epic.project.workspaceId,
            userId: req.user.id,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    }).catch(err => logger.error('[updateEpic] Event publication error:', { error: err.message, userId: req.user.id, requestId: req.headers['x-request-id'] }));

    return ApiResponse.success(res, {
        data: { epic: updatedEpic },
        message: "Epic updated successfully"
    });
});

export const deleteEpic = asyncHandler(async (req, res) => {
    const { epicId } = req.params;

    const epic = await prisma.epic.findUnique({
        where: { id: epicId },
        include: { project: true }
    });

    if (!epic) {
        throw new NotFoundError("Epic not found");
    }

    const hasPermission = await canManageEpics(req.user.id, epic.project.workspaceId);
    if (!hasPermission) {
        throw new ForbiddenError("You do not have permission to delete Epics");
    }

    const previousState = { ...epic };

    await prisma.epic.delete({
        where: { id: epicId }
    });

    await eventBus.publish('app/epic.deleted', {
        epicId,
        epicName: epic.name,
        workspaceId: epic.project.workspaceId,
        previousState,
        auditContext: {
            workspaceId: epic.project.workspaceId,
            userId: req.user.id,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    }).catch(err => logger.error('[deleteEpic] Event publication error:', { error: err.message, userId: req.user.id, requestId: req.headers['x-request-id'] }));

    return ApiResponse.success(res, {
        message: "Epic deleted successfully"
    });
});

export default {
    updateEpic,
    deleteEpic
};
