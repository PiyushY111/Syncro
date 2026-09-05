import { prisma } from "../../config/prisma.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";

export const deleteMilestone = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const previousState = await prisma.milestone.findUnique({
        where: { id },
        include: { project: true }
    });

    if (!previousState) {
        throw new NotFoundError("Milestone not found");
    }

    const canManage = await hasWorkspacePermission(req.user.id, previousState.project.workspaceId, "manageMilestones");
    if (!canManage) {
        throw new ForbiddenError("You do not have permission to delete milestones in this workspace");
    }

    // Unlink tasks before deleting
    await prisma.task.updateMany({
        where: { milestoneId: id },
        data: { milestoneId: null }
    });

    await prisma.milestone.delete({
        where: { id }
    });

    await eventBus.publish('app/milestone.deleted', {
        milestoneId: id,
        milestoneName: previousState.title,
        workspaceId: previousState.project.workspaceId,
        previousState,
        auditContext: {
            workspaceId: previousState.project.workspaceId,
            userId: req.user.id,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.status(200).json({ message: "Milestone deleted successfully" });
});
