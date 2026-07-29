import { prisma } from "../../config/prisma.js";
import { logAuditEvent } from "../../services/auditLogger.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";

// Helper to check write permissions
const canManageSprints = async (userId, workspaceId) => {
    return await hasWorkspacePermission(userId, workspaceId, "editTasks");
};

// 1. Create a planned sprint
export const createSprint = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, goal, startDate, endDate } = req.body;

        if (!name || !startDate || !endDate) {
            return res.status(400).json({ message: "Sprint name, start date, and end date are required" });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const hasPermission = await canManageSprints(req.user.id, project.workspaceId);
        if (!hasPermission) {
            return res.status(403).json({ message: "You do not have permission to create sprints in this project" });
        }

        const sprint = await prisma.sprint.create({
            data: {
                name,
                goal: goal || "",
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                projectId,
                status: "PLANNED"
            }
        });

        await logAuditEvent({
            workspaceId: project.workspaceId,
            userId: req.user.id,
            action: "CREATE",
            entityType: "PROJECT", // Reusing PROJECT or TASK categories for audits
            entityId: sprint.id,
            entityName: sprint.name,
            newState: sprint,
            req
        });

        return res.status(201).json({
            message: "Sprint created successfully",
            sprint
        });
    } catch (error) {
        console.error("Error creating sprint:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// 2. Get project sprints (along with capacities and tasks)
export const getProjectSprints = async (req, res) => {
    try {
        const { projectId } = req.params;

        const sprints = await prisma.sprint.findMany({
            where: { projectId },
            include: {
                capacities: {
                    include: { user: true }
                },
                tasks: {
                    include: { assignee: true }
                }
            },
            orderBy: { createdAt: "asc" }
        });

        return res.status(200).json({ sprints });
    } catch (error) {
        console.error("Error fetching project sprints:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// 3. Start a planned sprint
export const startSprint = async (req, res) => {
    try {
        const { sprintId } = req.params;

        const sprint = await prisma.sprint.findUnique({
            where: { id: sprintId },
            include: { project: true }
        });

        if (!sprint) {
            return res.status(404).json({ message: "Sprint not found" });
        }

        const hasPermission = await canManageSprints(req.user.id, sprint.project.workspaceId);
        if (!hasPermission) {
            return res.status(403).json({ message: "You do not have permission to manage sprints" });
        }

        // Check if there is another active sprint in this project
        const activeSprint = await prisma.sprint.findFirst({
            where: {
                projectId: sprint.projectId,
                status: "ACTIVE"
            }
        });

        if (activeSprint) {
            return res.status(400).json({ message: `Cannot start sprint. Sprint '${activeSprint.name}' is currently active.` });
        }

        const updatedSprint = await prisma.sprint.update({
            where: { id: sprintId },
            data: { status: "ACTIVE" }
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

        return res.status(200).json({
            message: "Sprint started successfully",
            sprint: updatedSprint
        });
    } catch (error) {
        console.error("Error starting sprint:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// 4. Complete an active sprint
export const completeSprint = async (req, res) => {
    try {
        const { sprintId } = req.params;

        const sprint = await prisma.sprint.findUnique({
            where: { id: sprintId },
            include: { project: true }
        });

        if (!sprint) {
            return res.status(404).json({ message: "Sprint not found" });
        }

        const hasPermission = await canManageSprints(req.user.id, sprint.project.workspaceId);
        if (!hasPermission) {
            return res.status(403).json({ message: "You do not have permission to manage sprints" });
        }

        // Update sprint status to completed
        const updatedSprint = await prisma.sprint.update({
            where: { id: sprintId },
            data: { status: "COMPLETED" }
        });

        // Find all tasks in this sprint that are NOT "DONE"
        const incompleteTasks = await prisma.task.findMany({
            where: {
                sprintId,
                status: { not: "DONE" }
            }
        });

        // Move incomplete tasks back to backlog (sprintId = null)
        if (incompleteTasks.length > 0) {
            await prisma.task.updateMany({
                where: {
                    id: { in: incompleteTasks.map(t => t.id) }
                },
                data: { sprintId: null }
            });
        }

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

        return res.status(200).json({
            message: "Sprint completed successfully",
            sprint: updatedSprint,
            incompleteTasksMoved: incompleteTasks.length
        });
    } catch (error) {
        console.error("Error completing sprint:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// 5. Update sprint details
export const updateSprint = async (req, res) => {
    try {
        const { sprintId } = req.params;
        const { name, goal, startDate, endDate, status } = req.body;

        const sprint = await prisma.sprint.findUnique({
            where: { id: sprintId },
            include: { project: true }
        });

        if (!sprint) {
            return res.status(404).json({ message: "Sprint not found" });
        }

        const hasPermission = await canManageSprints(req.user.id, sprint.project.workspaceId);
        if (!hasPermission) {
            return res.status(403).json({ message: "You do not have permission to edit sprints" });
        }

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

        return res.status(200).json({
            message: "Sprint updated successfully",
            sprint: updatedSprint
        });
    } catch (error) {
        console.error("Error updating sprint:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// 6. Delete a sprint
export const deleteSprint = async (req, res) => {
    try {
        const { sprintId } = req.params;

        const sprint = await prisma.sprint.findUnique({
            where: { id: sprintId },
            include: { project: true }
        });

        if (!sprint) {
            return res.status(404).json({ message: "Sprint not found" });
        }

        const hasPermission = await canManageSprints(req.user.id, sprint.project.workspaceId);
        if (!hasPermission) {
            return res.status(403).json({ message: "You do not have permission to delete sprints" });
        }

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

// 7. Update/Set member capacity in sprint
export const updateCapacity = async (req, res) => {
    try {
        const { sprintId } = req.params;
        const { userId, capacity } = req.body;

        if (!userId || capacity === undefined) {
            return res.status(400).json({ message: "userId and capacity are required" });
        }

        const sprint = await prisma.sprint.findUnique({
            where: { id: sprintId },
            include: { project: true }
        });

        if (!sprint) {
            return res.status(404).json({ message: "Sprint not found" });
        }

        const hasPermission = await canManageSprints(req.user.id, sprint.project.workspaceId);
        if (!hasPermission) {
            return res.status(403).json({ message: "You do not have permission to manage capacity" });
        }

        const sprintCapacity = await prisma.sprintCapacity.upsert({
            where: {
                sprintId_userId: { sprintId, userId }
            },
            update: { capacity: parseInt(capacity, 10) },
            create: {
                sprintId,
                userId,
                capacity: parseInt(capacity, 10)
            },
            include: { user: true }
        });

        return res.status(200).json({
            message: "Capacity updated successfully",
            capacity: sprintCapacity
        });
    } catch (error) {
        console.error("Error updating capacity:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
