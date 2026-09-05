import { prisma } from "../../config/prisma.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";

export const updateMilestone = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, dueDate, startDate, status, color } = req.body;

    const previousState = await prisma.milestone.findUnique({
        where: { id },
        include: { project: true }
    });

    if (!previousState) {
        throw new NotFoundError("Milestone not found");
    }

    const canManage = await hasWorkspacePermission(req.user.id, previousState.project.workspaceId, "manageMilestones");
    if (!canManage) {
        throw new ForbiddenError("You do not have permission to manage milestones in this workspace");
    }

    const dataToUpdate = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (dueDate !== undefined) dataToUpdate.dueDate = new Date(dueDate);
    if (startDate !== undefined) dataToUpdate.startDate = startDate ? new Date(startDate) : null;
    if (status !== undefined) dataToUpdate.status = status;
    if (color !== undefined) dataToUpdate.color = color;

    const updatedMilestone = await prisma.milestone.update({
        where: { id },
        data: dataToUpdate,
        include: {
            tasks: { select: { id: true, title: true, status: true } }
        }
    });

    await eventBus.publish('app/milestone.updated', {
        milestone: updatedMilestone,
        previousState,
        workspaceId: previousState.project.workspaceId,
        auditContext: {
            workspaceId: previousState.project.workspaceId,
            userId: req.user.id,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.status(200).json({
        message: "Milestone updated successfully",
        milestone: updatedMilestone
    });
});
