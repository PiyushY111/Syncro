import { prisma } from "../../config/prisma.js";
import { logAuditEvent } from "../../services/auditLogger.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";

export const updateMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, startDate, status, color } = req.body;

        const previousState = await prisma.milestone.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!previousState) {
            return res.status(404).json({ message: "Milestone not found" });
        }

        const canManage = await hasWorkspacePermission(req.user.id, previousState.project.workspaceId, "manageMilestones");
        if (!canManage) {
            return res.status(403).json({ message: "You do not have permission to manage milestones in this workspace" });
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

        await logAuditEvent({
            workspaceId: previousState.project.workspaceId,
            userId: req.user.id,
            action: "UPDATE",
            entityType: "MILESTONE",
            entityId: id,
            entityName: updatedMilestone.title,
            previousState,
            newState: updatedMilestone,
            req
        });

        return res.status(200).json({
            message: "Milestone updated successfully",
            milestone: updatedMilestone
        });
    } catch (error) {
        console.error("Error updating milestone:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
