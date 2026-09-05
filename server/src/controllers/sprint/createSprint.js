import { prisma } from "../../config/prisma.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";

const canManageSprints = async (userId, workspaceId) => {
    return await hasWorkspacePermission(userId, workspaceId, "editTasks");
};

export const createSprint = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { name, goal, startDate, endDate } = req.body;

    if (!name || !startDate || !endDate) {
        throw new BadRequestError("Sprint name, start date, and end date are required");
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });

    if (!project) {
        throw new NotFoundError("Project not found");
    }

    const hasPermission = await canManageSprints(req.user.id, project.workspaceId);
    if (!hasPermission) {
        throw new ForbiddenError("You do not have permission to create sprints in this project");
    }

    const sprint = await prisma.sprint.create({
        data: {
            name,
            goal: goal || "",
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            projectId,
            status: "PLANNED"
        }
    });

    await eventBus.publish('app/sprint.created', {
        sprint,
        workspaceId: project.workspaceId,
        auditContext: {
            workspaceId: project.workspaceId,
            userId: req.user.id,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.status(201).json({
        message: "Sprint created successfully",
        sprint
    });
});
