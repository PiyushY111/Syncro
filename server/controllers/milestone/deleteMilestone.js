import { prisma } from "../../config/prisma.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";

export const deleteMilestone = async (req, res) => {
    try {
        const { id } = req.params;

        const previousState = await prisma.milestone.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!previousState) {
            return res.status(404).json({ message: "Milestone not found" });
        }

        const canManage = await hasWorkspacePermission(req.user.id, previousState.project.workspaceId, "manageMilestones");
        if (!canManage) {
            return res.status(403).json({ message: "You do not have permission to delete milestones in this workspace" });
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
    } catch (error) {
        console.error("Error deleting milestone:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
