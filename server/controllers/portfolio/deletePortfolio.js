import { prisma } from "../../config/prisma.js";
import { redisCache } from "../../config/redis.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";

export const deletePortfolio = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.portfolio.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Portfolio not found" });
        }

        const isOwner = existing.ownerId === req.user.id;
        const canManage = await hasWorkspacePermission(req.user.id, existing.workspaceId, "managePortfolios");

        if (!isOwner && !canManage) {
            return res.status(403).json({ message: "You do not have permission to delete this portfolio" });
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
    } catch (error) {
        console.error("Error deleting portfolio:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
