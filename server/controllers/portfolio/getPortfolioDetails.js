import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole } from "../role/checkPermissionHelper.js";

export const getPortfolioById = async (req, res) => {
    try {
        const { id } = req.params;

        const portfolio = await prisma.portfolio.findUnique({
            where: { id },
            include: {
                owner: true,
                projects: {
                    include: {
                        project: {
                            include: {
                                owner: true,
                                members: { include: { user: true } },
                                tasks: { include: { assignee: true } },
                                milestones: true
                            }
                        }
                    },
                    orderBy: { order: "asc" }
                }
            }
        });

        if (!portfolio) {
            return res.status(404).json({ message: "Portfolio not found" });
        }

        const { role } = await getUserWorkspaceRole(req.user.id, portfolio.workspaceId);
        if (!role) {
            return res.status(403).json({ message: "Access restricted to workspace members only" });
        }

        let totalTasks = 0;
        let completedTasks = 0;
        let totalMilestones = 0;
        let achievedMilestones = 0;

        portfolio.projects.forEach(({ project }) => {
            const tasks = project.tasks || [];
            totalTasks += tasks.length;
            completedTasks += tasks.filter(t => t.status === "DONE").length;

            const milestones = project.milestones || [];
            totalMilestones += milestones.length;
            achievedMilestones += milestones.filter(m => m.status === "ACHIEVED").length;
        });

        const projectCount = portfolio.projects.length;
        const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const milestoneProgress = totalMilestones > 0 ? Math.round((achievedMilestones / totalMilestones) * 100) : 0;

        return res.status(200).json({
            portfolio: {
                ...portfolio,
                projectCount,
                totalTasks,
                completedTasks,
                totalMilestones,
                achievedMilestones,
                taskProgress,
                milestoneProgress
            }
        });
    } catch (error) {
        console.error("Error fetching portfolio details:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
