import { prisma } from "../../config/prisma.js";
import { logAuditEvent } from "../../services/auditLogger.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";

const canManageSprints = async (userId, workspaceId) => {
    return await hasWorkspacePermission(userId, workspaceId, "editTasks");
};

export const updateSprint = async (req, res) => {
    try {
        const { sprintId } = req.params;
        const { name, goal, startDate, endDate, status } = req.body;

        const sprint = await prisma.sprint.findUnique({
            where: { id: sprintId },
            include: { project: true }
        });

        if (!sprint) return res.status(404).json({ message: "Sprint not found" });

        const hasPermission = await canManageSprints(req.user.id, sprint.project.workspaceId);
        if (!hasPermission) return res.status(403).json({ message: "You do not have permission to edit sprints" });

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

        await logAuditEvent({
            workspaceId: sprint.project.workspaceId,
            userId: req.user.id,
            action: "UPDATE",
            entityType: "PROJECT",
            entityId: sprint.id,
            entityName: sprint.name,
            newState: updatedSprint,
            req
        });

        return res.status(200).json({ message: "Sprint updated successfully", sprint: updatedSprint });
    } catch (error) {
        console.error("Error updating sprint:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteSprint = async (req, res) => {
    try {
        const { sprintId } = req.params;

        const sprint = await prisma.sprint.findUnique({
            where: { id: sprintId },
            include: { project: true }
        });

        if (!sprint) return res.status(404).json({ message: "Sprint not found" });

        const hasPermission = await canManageSprints(req.user.id, sprint.project.workspaceId);
        if (!hasPermission) return res.status(403).json({ message: "You do not have permission to delete sprints" });

        await prisma.sprint.delete({
            where: { id: sprintId }
        });

        await logAuditEvent({
            workspaceId: sprint.project.workspaceId,
            userId: req.user.id,
            action: "DELETE",
            entityType: "PROJECT",
            entityId: sprint.id,
            entityName: sprint.name,
            req
        });

        return res.status(200).json({ message: "Sprint deleted successfully" });
    } catch (error) {
        console.error("Error deleting sprint:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
