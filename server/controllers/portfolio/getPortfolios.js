import { prisma } from "../../config/prisma.js";
import { redisCache } from "../../config/redis.js";
import { getUserWorkspaceRole } from "../role/checkPermissionHelper.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BadRequestError, ForbiddenError } from "../../utils/errors/appError.js";

export const getWorkspacePortfolios = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    if (!workspaceId) {
        throw new BadRequestError("workspaceId is required");
    }

    const { role } = await getUserWorkspaceRole(req.user.id, workspaceId);
    if (!role) {
        throw new ForbiddenError("Access restricted to workspace members only");
    }

    const cacheKey = `workspace:portfolios:${workspaceId}`;
    try {
        const cached = await redisCache.get(cacheKey);
        if (cached) {
            const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
            return res.status(200).json({ portfolios: parsed });
        }
    } catch {}

    const portfolios = await prisma.portfolio.findMany({
        where: { workspaceId },
        include: {
            owner: true,
            projects: {
                include: {
                    project: {
                        include: {
                            tasks: { select: { id: true, status: true, due_date: true } },
                            milestones: { select: { id: true, status: true, dueDate: true } }
                        }
                    }
                },
                orderBy: { order: "asc" }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    const formattedPortfolios = portfolios.map((portfolio) => {
        const projectCount = portfolio.projects.length;
        let totalTasks = 0;
        let completedTasks = 0;
        let totalProgress = 0;
        let atRiskCount = 0;

        portfolio.projects.forEach(({ project }) => {
            const projTasks = project.tasks || [];
            const projCompleted = projTasks.filter(t => t.status === "DONE").length;
            totalTasks += projTasks.length;
            completedTasks += projCompleted;

            const projProgress = projTasks.length > 0
                ? Math.round((projCompleted / projTasks.length) * 100)
                : (project.progress || 0);

            totalProgress += projProgress;

            // Check overdue tasks or missed milestones
            const hasOverdue = projTasks.some(t => new Date(t.due_date) < new Date() && t.status !== "DONE");
            if (hasOverdue) atRiskCount++;
        });

        const avgProgress = projectCount > 0 ? Math.round(totalProgress / projectCount) : 0;
        let health = "ON_TRACK";
        if (atRiskCount > 0 && atRiskCount >= Math.ceil(projectCount / 2)) {
            health = "OFF_TRACK";
        } else if (atRiskCount > 0) {
            health = "AT_RISK";
        }

        return {
            ...portfolio,
            projectCount,
            totalTasks,
            completedTasks,
            avgProgress,
            health
        };
    });

    try {
        await redisCache.set(cacheKey, JSON.stringify(formattedPortfolios), 60);
    } catch {}

    return res.status(200).json({ portfolios: formattedPortfolios });
});
