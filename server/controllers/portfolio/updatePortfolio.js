import { prisma } from "../../config/prisma.js";
import { redisCache } from "../../config/redis.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";

export const updatePortfolio = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color, icon, status } = req.body;

        const previousState = await prisma.portfolio.findUnique({
            where: { id },
            include: {
                projects: { include: { project: true } },
                owner: true
            }
        });

        if (!previousState) {
            return res.status(404).json({ message: "Portfolio not found" });
        }

        const isOwner = previousState.ownerId === req.user.id;
        const canManage = await hasWorkspacePermission(req.user.id, previousState.workspaceId, "managePortfolios");

        if (!isOwner && !canManage) {
            return res.status(403).json({ message: "You do not have permission to update this portfolio" });
        }

        const dataToUpdate = {};
        if (name !== undefined) dataToUpdate.name = name;
        if (description !== undefined) dataToUpdate.description = description;
        if (color !== undefined) dataToUpdate.color = color;
        if (icon !== undefined) dataToUpdate.icon = icon;
        if (status !== undefined) dataToUpdate.status = status;

        const updated = await prisma.portfolio.update({
            where: { id },
            data: dataToUpdate,
            include: {
                projects: { include: { project: true } },
                owner: true
            }
        });

        // Invalidate Redis caches
        try {
            await redisCache.del(`portfolio:detail:${id}`);
            await redisCache.del(`workspace:portfolios:${previousState.workspaceId}`);
        } catch {}

        await eventBus.publish('app/portfolio.updated', {
            portfolio: updated,
            previousState,
            workspaceId: previousState.workspaceId,
            auditContext: {
                workspaceId: previousState.workspaceId,
                userId: req.user.id,
                ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                userAgent: req.headers["user-agent"]
            }
        });

        return res.status(200).json({
            message: "Portfolio updated successfully",
            portfolio: updated
        });
    } catch (error) {
        console.error("Error updating portfolio:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
