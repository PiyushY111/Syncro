import { prisma } from "../../config/prisma.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";

const canManageEpics = async (userId, workspaceId) => {
    return await hasWorkspacePermission(userId, workspaceId, "editTasks");
};

export const updateEpic = async (req, res) => {
    try {
        const { epicId } = req.params;
        const { name, description, color } = req.body;

        const epic = await prisma.epic.findUnique({
            where: { id: epicId },
            include: { project: true }
        });

        if (!epic) return res.status(404).json({ message: "Epic not found" });

        const hasPermission = await canManageEpics(req.user.id, epic.project.workspaceId);
        if (!hasPermission) return res.status(403).json({ message: "You do not have permission to edit Epics" });

        const updateData = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (color) updateData.color = color;

        const updatedEpic = await prisma.epic.update({
            where: { id: epicId },
            data: updateData
        });

        await eventBus.publish('app/epic.updated', {
            epic: updatedEpic,
            previousState: epic,
            workspaceId: epic.project.workspaceId,
            auditContext: {
                workspaceId: epic.project.workspaceId,
                userId: req.user.id,
                ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                userAgent: req.headers["user-agent"]
            }
        });

        return res.status(200).json({ message: "Epic updated successfully", epic: updatedEpic });
    } catch (error) {
        console.error("Error updating Epic:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteEpic = async (req, res) => {
    try {
        const { epicId } = req.params;

        const epic = await prisma.epic.findUnique({
            where: { id: epicId },
            include: { project: true }
        });

        if (!epic) return res.status(404).json({ message: "Epic not found" });

        const hasPermission = await canManageEpics(req.user.id, epic.project.workspaceId);
        if (!hasPermission) return res.status(403).json({ message: "You do not have permission to delete Epics" });

        const previousState = { ...epic };

        await prisma.epic.delete({
            where: { id: epicId }
        });

        await eventBus.publish('app/epic.deleted', {
            epicId,
            epicName: epic.name,
            workspaceId: epic.project.workspaceId,
            previousState,
            auditContext: {
                workspaceId: epic.project.workspaceId,
                userId: req.user.id,
                ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                userAgent: req.headers["user-agent"]
            }
        });

        return res.status(200).json({ message: "Epic deleted successfully" });
    } catch (error) {
        console.error("Error deleting Epic:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
