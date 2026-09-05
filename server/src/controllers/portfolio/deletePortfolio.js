import { prisma } from "../../config/prisma.js";
import { redisCache } from "../../config/redis.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";

export const deletePortfolio = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.portfolio.findUnique({ where: { id } });
    if (!existing) {
        throw new NotFoundError("Portfolio not found");
    }

    const isOwner = existing.ownerId === req.user.id;
    const canManage = await hasWorkspacePermission(req.user.id, existing.workspaceId, "managePortfolios");

    if (!isOwner && !canManage) {
        throw new ForbiddenError("You do not have permission to delete this portfolio");
    }

    const previousState = { ...existing };

    await prisma.portfolio.delete({ where: { id } });

    // Invalidate Redis caches
    try {
        await redisCache.del(`portfolio:detail:${id}`);
        await redisCache.del(`workspace:portfolios:${existing.workspaceId}`);
    } catch {}

    await eventBus.publish('app/portfolio.deleted', {
        portfolioId: id,
        portfolioName: existing.name,
        workspaceId: existing.workspaceId,
        previousState,
        auditContext: {
            workspaceId: existing.workspaceId,
            userId: req.user.id,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.status(200).json({ message: "Portfolio deleted successfully" });
});
