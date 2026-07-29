import { prisma } from "../../config/prisma.js";
import { logAuditEvent } from "../../services/auditLogger.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";

// Helper to check write permissions
const canManageEpics = async (userId, workspaceId) => {
    return await hasWorkspacePermission(userId, workspaceId, "editTasks");
};

// 1. Create an Epic
export const createEpic = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, description, color } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Epic name is required" });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const hasPermission = await canManageEpics(req.user.id, project.workspaceId);
        if (!hasPermission) {
            return res.status(403).json({ message: "You do not have permission to manage Epics" });
        }

        const epic = await prisma.epic.create({
            data: {
                name,
                description: description || "",
                color: color || "#8B5CF6",
                projectId
            }
        });

        await logAuditEvent({
            workspaceId: project.workspaceId,
            userId: req.user.id,
            action: "CREATE",
            entityType: "PROJECT",
            entityId: epic.id,
            entityName: epic.name,
            newState: epic,
            req
        });

        return res.status(201).json({
            message: "Epic created successfully",
            epic
        });
    } catch (error) {
        console.error("Error creating Epic:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// 2. Fetch project Epics with tasks summary
export const getProjectEpics = async (req, res) => {
    try {
        const { projectId } = req.params;

        const epics = await prisma.epic.findMany({
            where: { projectId },
            include: {
                tasks: true
            },
            orderBy: { createdAt: "desc" }
        });

        // Map status progress percentage for each epic
        const epicsWithProgress = epics.map(epic => {
            const totalTasks = epic.tasks.length;
            const completedTasks = epic.tasks.filter(t => t.status === "DONE").length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            return {
                ...epic,
                progress,
                totalTasks,
                completedTasks
            };
        });

        return res.status(200).json({ epics: epicsWithProgress });
    } catch (error) {
        console.error("Error fetching project Epics:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// 3. Update an Epic
export const updateEpic = async (req, res) => {
    try {
        const { epicId } = req.params;
        const { name, description, color } = req.body;

        const epic = await prisma.epic.findUnique({
            where: { id: epicId },
            include: { project: true }
        });

        if (!epic) {
            return res.status(404).json({ message: "Epic not found" });
        }

        const hasPermission = await canManageEpics(req.user.id, epic.project.workspaceId);
        if (!hasPermission) {
            return res.status(403).json({ message: "You do not have permission to edit Epics" });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (color) updateData.color = color;

        const updatedEpic = await prisma.epic.update({
            where: { id: epicId },
            data: updateData
        });

        await logAuditEvent({
            workspaceId: epic.project.workspaceId,
            userId: req.user.id,
            action: "UPDATE",
            entityType: "PROJECT",
            entityId: epic.id,
            entityName: epic.name,
            newState: updatedEpic,
            req
        });

        return res.status(200).json({
            message: "Epic updated successfully",
            epic: updatedEpic
        });
    } catch (error) {
        console.error("Error updating Epic:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// 4. Delete an Epic
export const deleteEpic = async (req, res) => {
    try {
        const { epicId } = req.params;

        const epic = await prisma.epic.findUnique({
            where: { id: epicId },
            include: { project: true }
        });

        if (!epic) {
            return res.status(404).json({ message: "Epic not found" });
        }

        const hasPermission = await canManageEpics(req.user.id, epic.project.workspaceId);
        if (!hasPermission) {
            return res.status(403).json({ message: "You do not have permission to delete Epics" });
        }

        await prisma.epic.delete({
            where: { id: epicId }
        });

        await logAuditEvent({
            workspaceId: epic.project.workspaceId,
            userId: req.user.id,
            action: "DELETE",
            entityType: "PROJECT",
            entityId: epic.id,
            entityName: epic.name,
            req
        });

        return res.status(200).json({ message: "Epic deleted successfully" });
    } catch (error) {
        console.error("Error deleting Epic:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
