import { prisma } from "../../config/prisma.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/response/apiResponse.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";

const canManageEpics = async (userId, workspaceId) => {
    return await hasWorkspacePermission(userId, workspaceId, "editTasks");
};

export const createEpic = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { name, description, color } = req.body;

    if (!name || !name.trim()) {
        throw new BadRequestError("Epic name is required");
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });

    if (!project) {
        throw new NotFoundError("Project not found");
    }

    const hasPermission = await canManageEpics(req.user.id, project.workspaceId);
    if (!hasPermission) {
        throw new ForbiddenError("You do not have permission to manage Epics");
    }

    const epic = await prisma.epic.create({
        data: {
            name: name.trim(),
            description: description ? description.trim() : "",
            color: color || "#8B5CF6",
            projectId
        }
    });

    await eventBus.publish('app/epic.created', {
        epic,
        workspaceId: project.workspaceId,
        auditContext: {
            workspaceId: project.workspaceId,
            userId: req.user.id,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    }).catch(err => console.error('[createEpic] Event publication error:', err));

    return ApiResponse.created(res, {
        data: { epic },
        message: "Epic created successfully"
    });
});

export default createEpic;
