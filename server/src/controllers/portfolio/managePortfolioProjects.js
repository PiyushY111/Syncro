import { prisma } from "../../config/prisma.js";
import { redisCache } from "../../config/redis.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";

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

    const isOwner = portfolio.ownerId === req.user.id;
    const canManage = await hasWorkspacePermission(req.user.id, portfolio.workspaceId, "managePortfolios");
    if (!isOwner && !canManage) {
        throw new ForbiddenError("You do not have permission to manage this portfolio's projects");
    }

    // Every project added to a portfolio must belong to the portfolio's own
    // workspace — otherwise a portfolio could be used to pull another
    // workspace's project name/progress/tasks/milestones into view (see
    // getPortfolioById, which returns that data to any workspace member).
    const uniqueProjectIds = [...new Set(projectIds)];
    const validProjects = await prisma.project.findMany({
        where: { id: { in: uniqueProjectIds }, workspaceId: portfolio.workspaceId },
        select: { id: true },
    });
    if (validProjects.length !== uniqueProjectIds.length) {
        throw new NotFoundError("One or more projects not found");
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

    const isOwner = portfolio.ownerId === req.user.id;
    const canManage = await hasWorkspacePermission(req.user.id, portfolio.workspaceId, "managePortfolios");
    if (!isOwner && !canManage) {
        throw new ForbiddenError("You do not have permission to manage this portfolio's projects");
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
