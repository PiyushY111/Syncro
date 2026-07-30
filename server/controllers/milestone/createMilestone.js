import { prisma } from "../../config/prisma.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";

export const createMilestone = async (req, res) => {
    try {
        const { projectId, title, description, dueDate, startDate, status, color } = req.body;

        if (!projectId || !title || !dueDate) {
            return res.status(400).json({ message: "projectId, title, and dueDate are required" });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const canManage = await hasWorkspacePermission(req.user.id, project.workspaceId, "manageMilestones");
        if (!canManage) {
            return res.status(403).json({ message: "You do not have permission to manage milestones in this workspace" });
        }

        const milestone = await prisma.milestone.create({
            data: {
                title,
                description: description || "",
                dueDate: new Date(dueDate),
                startDate: startDate ? new Date(startDate) : null,
                status: status || "PLANNED",
                color: color || "#3B82F6",
                projectId
            },
            include: {
                tasks: {
                    include: { assignee: true }
                }
            }
        });

        await eventBus.publish('app/milestone.created', {
            milestone,
            workspaceId: project.workspaceId,
            auditContext: {
                workspaceId: project.workspaceId,
                userId: req.user.id,
                ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                userAgent: req.headers["user-agent"]
            }
        });

        return res.status(201).json({
            message: "Milestone created successfully",
            milestone
        });
    } catch (error) {
        console.error("Error creating milestone:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
