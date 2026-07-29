import { prisma } from "../../config/prisma.js";
import { logAuditEvent } from "../../services/auditLogger.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";

const canManageEpics = async (userId, workspaceId) => {
    return await hasWorkspacePermission(userId, workspaceId, "editTasks");
};

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

        return res.status(201).json({ message: "Epic created successfully", epic });
    } catch (error) {
        console.error("Error creating Epic:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
