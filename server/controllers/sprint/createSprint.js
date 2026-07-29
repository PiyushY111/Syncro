import { prisma } from "../../config/prisma.js";
import { logAuditEvent } from "../../services/auditLogger.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";

const canManageSprints = async (userId, workspaceId) => {
    return await hasWorkspacePermission(userId, workspaceId, "editTasks");
};

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
            entityType: "PROJECT",
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
