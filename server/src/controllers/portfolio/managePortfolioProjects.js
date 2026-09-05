import { prisma } from "../../config/prisma.js";
import { redisCache } from "../../config/redis.js";
import { eventBus } from "../../services/eventBus.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../../utils/errors/appError.js";

export const addProjectsToPortfolio = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { projectIds } = req.body;

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
        throw new BadRequestError("projectIds array is required");
    }

    const portfolio = await prisma.portfolio.findUnique({ where: { id } });
    if (!portfolio) {
        throw new NotFoundError("Portfolio not found");
    }

    const currentCount = await prisma.portfolioProject.count({ where: { portfolioId: id } });

    const newEntries = projectIds.map((pid, index) => ({
        portfolioId: id,
        projectId: pid,
        order: currentCount + index
    }));

    const previousState = { ...portfolio };

    await prisma.portfolioProject.createMany({
        data: newEntries,
        skipDuplicates: true
    });

    // Invalidate Redis caches
    try {
        await redisCache.del(`portfolio:detail:${id}`);
        await redisCache.del(`workspace:portfolios:${portfolio.workspaceId}`);
    } catch {}

    await eventBus.publish('app/portfolio.updated', {
        portfolio,
        previousState,
        workspaceId: portfolio.workspaceId,
        auditContext: {
            workspaceId: portfolio.workspaceId,
            userId: req.user.id,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.status(200).json({ message: "Projects added to portfolio successfully" });
});

export const removeProjectFromPortfolio = asyncHandler(async (req, res) => {
    const { id, projectId } = req.params;
    const portfolio = await prisma.portfolio.findUnique({ where: { id } });
    if (!portfolio) {
        throw new NotFoundError("Portfolio not found");
    }
    const previousState = { ...portfolio };

    await prisma.portfolioProject.deleteMany({
        where: { portfolioId: id, projectId }
    });

    // Invalidate Redis caches
    try {
        await redisCache.del(`portfolio:detail:${id}`);
        await redisCache.del(`workspace:portfolios:${portfolio.workspaceId}`);
    } catch {}

    await eventBus.publish('app/portfolio.updated', {
        portfolio,
        previousState,
        workspaceId: portfolio.workspaceId,
        auditContext: {
            workspaceId: portfolio.workspaceId,
            userId: req.user.id,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.status(200).json({ message: "Project removed from portfolio" });
});
