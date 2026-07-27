import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole } from "../role/checkPermissionHelper.js";

export const getMilestones = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ message: "projectId is required" });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const { role } = await getUserWorkspaceRole(req.user.id, project.workspaceId);
        if (!role) {
            return res.status(403).json({ message: "Access restricted to workspace members only" });
        }

        const milestones = await prisma.milestone.findMany({
            where: { projectId },
            include: {
                tasks: {
                    select: { id: true, title: true, status: true, due_date: true, priority: true }
                }
            },
            orderBy: { dueDate: "asc" }
        });

        const now = new Date();

        const formattedMilestones = milestones.map((m) => {
            const totalTasks = m.tasks.length;
            const completedTasks = m.tasks.filter((t) => t.status === "DONE").length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            let health = "ON_TRACK";
            if (m.status === "ACHIEVED") {
                health = "ON_TRACK";
            } else if (new Date(m.dueDate) < now && progress < 100) {
                health = "OFF_TRACK";
            } else if (progress < 50 && (new Date(m.dueDate) - now) < (3 * 24 * 60 * 60 * 1000)) {
                health = "AT_RISK";
            }

            return {
                ...m,
                totalTasks,
                completedTasks,
                progress,
                health
            };
        });

        return res.status(200).json({ milestones: formattedMilestones });
    } catch (error) {
        console.error("Error fetching milestones:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
