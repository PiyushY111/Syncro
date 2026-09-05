import { prisma } from "../../config/prisma.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";

const canManageSprints = async (userId, workspaceId) => {
    return await hasWorkspacePermission(userId, workspaceId, "editTasks");
};

export const updateSprint = asyncHandler(async (req, res) => {
    const { sprintId } = req.params;
    const { name, goal, startDate, endDate, status } = req.body;

    const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
        include: { project: true }
    });

    if (!sprint) throw new NotFoundError("Sprint not found");

    const hasPermission = await canManageSprints(req.user.id, sprint.project.workspaceId);
    if (!hasPermission) throw new ForbiddenError("You do not have permission to edit sprints");

    const updateData = {};
    if (name) updateData.name = name;
    if (goal !== undefined) updateData.goal = goal;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (status) updateData.status = status;

    const updatedSprint = await prisma.sprint.update({
        where: { id: sprintId },
        data: updateData
    });

    await eventBus.publish('app/sprint.updated', {
        sprint: updatedSprint,
        previousState: sprint,
        workspaceId: sprint.project.workspaceId,
        auditContext: {
            workspaceId: sprint.project.workspaceId,
            userId: req.user.id,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.status(200).json({ message: "Sprint updated successfully", sprint: updatedSprint });
});

export const deleteSprint = asyncHandler(async (req, res) => {
    const { sprintId } = req.params;

    const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
        include: { project: true }
    });

    if (!sprint) throw new NotFoundError("Sprint not found");

    const hasPermission = await canManageSprints(req.user.id, sprint.project.workspaceId);
    if (!hasPermission) throw new ForbiddenError("You do not have permission to delete sprints");

    const previousState = { ...sprint };

    await prisma.sprint.delete({
        where: { id: sprintId }
    });

    await eventBus.publish('app/sprint.deleted', {
        sprintId,
        sprintName: sprint.name,
        workspaceId: sprint.project.workspaceId,
        previousState,
        auditContext: {
            workspaceId: sprint.project.workspaceId,
            userId: req.user.id,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.status(200).json({ message: "Sprint deleted successfully" });
});
