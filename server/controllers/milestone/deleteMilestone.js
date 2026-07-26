import { prisma } from "../../config/prisma.js";
import { logAuditEvent } from "../../services/auditLogger.js";

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

        // Unlink tasks before deleting
        await prisma.task.updateMany({
            where: { milestoneId: id },
            data: { milestoneId: null }
        });

        await prisma.milestone.delete({
            where: { id }
        });

        await logAuditEvent({
            workspaceId: previousState.project.workspaceId,
            userId: req.user.id,
            action: "DELETE",
            entityType: "MILESTONE",
            entityId: id,
            entityName: previousState.title,
            previousState,
            req
        });

        return res.status(200).json({ message: "Milestone deleted successfully" });
    } catch (error) {
        console.error("Error deleting milestone:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
