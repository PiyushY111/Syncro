import { prisma } from "../../config/prisma.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";

export const createMilestone = asyncHandler(async (req, res) => {
    const { projectId, title, description, dueDate, startDate, status, color } = req.body;

    if (!projectId || !title || !dueDate) {
        throw new BadRequestError("projectId, title, and dueDate are required");
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });

    if (!project) {
        throw new NotFoundError("Project not found");
    }

    const canManage = await hasWorkspacePermission(req.user.id, project.workspaceId, "manageMilestones");
    if (!canManage) {
        throw new ForbiddenError("You do not have permission to manage milestones in this workspace");
    }

    const milestone = await prisma.milestone.create({
        data: {
            title,
            description: description || "",
            dueDate: new Date(dueDate),
            startDate: startDate ? new Date(startDate) : null,
            status: status || "PLANNED",
            color: color || "#3B82F6",
            projectId
        },
        include: {
            tasks: {
                include: { assignee: true }
            }
        }
    });

    await eventBus.publish('app/milestone.created', {
        milestone,
        workspaceId: project.workspaceId,
        auditContext: {
            workspaceId: project.workspaceId,
            userId: req.user.id,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.status(201).json({
        message: "Milestone created successfully",
        milestone
    });
});
