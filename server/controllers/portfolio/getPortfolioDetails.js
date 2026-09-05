import { prisma } from "../../config/prisma.js";
import { redisCache } from "../../config/redis.js";
import { getUserWorkspaceRole } from "../role/checkPermissionHelper.js";

export const getPortfolioById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Portfolio ID is required" });
        }

        // 1. Check Redis cache for instant 0ms retrieval
        const cacheKey = `portfolio:detail:${id}`;
        try {
            const cached = await redisCache.get(cacheKey);
            if (cached) {
                const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
                const { role } = await getUserWorkspaceRole(req.user.id, parsed.workspaceId);
                if (!role) {
                    return res.status(403).json({ message: "Access restricted to workspace members only" });
                }
                return res.status(200).json({ portfolio: parsed });
            }
        } catch {}

        const portfolio = await prisma.portfolio.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                icon: true,
                status: true,
                workspaceId: true,
                ownerId: true,
                createdAt: true,
                updatedAt: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                projects: {
                    select: {
                        id: true,
                        portfolioId: true,
                        projectId: true,
                        order: true,
                        addedAt: true,
                        project: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                status: true,
                                progress: true,
                                owner: {
                                    select: {
                                        id: true,
                                        name: true,
                                        image: true
                                    }
                                },
                                tasks: {
                                    select: {
                                        id: true,
                                        status: true
                                    }
                                },
                                milestones: {
                                    select: {
                                        id: true,
                                        status: true
                                    }
                                }
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
            if (!project) return;
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

        const result = {
            ...portfolio,
            projectCount,
            totalTasks,
            completedTasks,
            totalMilestones,
            achievedMilestones,
            taskProgress,
            milestoneProgress
        };

        // Cache in Redis for 60 seconds
        try {
            await redisCache.set(cacheKey, JSON.stringify(result), 60);
        } catch {}

        return res.status(200).json({
            portfolio: result
        });
    } catch (error) {
        console.error("Error fetching portfolio details:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
