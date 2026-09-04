import { prisma } from "../../config/prisma.js";
import { executeTransaction } from "../../services/db/dbService.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";

const canManageSprints = async (userId, workspaceId) => {
    return await hasWorkspacePermission(userId, workspaceId, "editTasks");
};

export const startSprint = async (req, res) => {
    try {
        const { sprintId } = req.params;
        const sprint = await prisma.sprint.findUnique({
            where: { id: sprintId },
            include: { project: true }
        });

        if (!sprint) return res.status(404).json({ message: "Sprint not found" });

        const hasPermission = await canManageSprints(req.user.id, sprint.project.workspaceId);
        if (!hasPermission) return res.status(403).json({ message: "You do not have permission to manage sprints" });

        const activeSprint = await prisma.sprint.findFirst({
            where: { projectId: sprint.projectId, status: "ACTIVE" }
        });
        if (activeSprint) {
            return res.status(400).json({ message: `Cannot start sprint. Sprint '${activeSprint.name}' is currently active.` });
        }

        const updatedSprint = await prisma.sprint.update({
            where: { id: sprintId },
            data: { status: "ACTIVE" }
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

        return res.status(200).json({ message: "Sprint started successfully", sprint: updatedSprint });
    } catch (error) {
        console.error("Error starting sprint:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const completeSprint = async (req, res) => {
    try {
        const { sprintId } = req.params;
        const sprint = await prisma.sprint.findUnique({
            where: { id: sprintId },
            include: { project: true }
        });

        if (!sprint) return res.status(404).json({ message: "Sprint not found" });

        const hasPermission = await canManageSprints(req.user.id, sprint.project.workspaceId);
        if (!hasPermission) return res.status(403).json({ message: "You do not have permission to manage sprints" });

        const { updatedSprint, incompleteTasksCount } = await executeTransaction(async (tx) => {
            const updated = await tx.sprint.update({
                where: { id: sprintId },
                data: { status: "COMPLETED" }
            });

            const incompleteTasks = await tx.task.findMany({
                where: { sprintId, status: { not: "DONE" } }
            });

            if (incompleteTasks.length > 0) {
                await tx.task.updateMany({
                    where: { id: { in: incompleteTasks.map(t => t.id) } },
                    data: { sprintId: null }
                });
            }

            return { updatedSprint: updated, incompleteTasksCount: incompleteTasks.length };
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

        return res.status(200).json({
            message: "Sprint completed successfully",
            sprint: updatedSprint,
            incompleteTasksMoved: incompleteTasksCount
        });
    } catch (error) {
        console.error("Error completing sprint:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
