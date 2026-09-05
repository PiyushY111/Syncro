import { prisma } from "../../config/prisma.js";
import { redisCache } from "../../config/redis.js";
import { eventBus } from "../../services/eventBus.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";

export const createPortfolio = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { workspaceId, name, description, color, icon, status, projectIds } = req.body;

    if (!workspaceId || !name) {
        throw new BadRequestError("workspaceId and name are required");
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId }
    });

    if (!workspace) {
        throw new NotFoundError("Workspace not found");
    }

    const canManage = await hasWorkspacePermission(userId, workspaceId, "managePortfolios");
    if (!canManage) {
        throw new ForbiddenError("You do not have permission to create portfolios in this workspace");
    }

    const portfolio = await prisma.portfolio.create({
        data: {
            name,
            description: description || "",
            color: color || "#6366F1",
            icon: icon || "FolderKanban",
            status: status || "ACTIVE",
            workspaceId,
            ownerId: userId
        }
    });

    if (Array.isArray(projectIds) && projectIds.length > 0) {
        await prisma.portfolioProject.createMany({
            data: projectIds.map((pid, idx) => ({
                portfolioId: portfolio.id,
                projectId: pid,
                order: idx
            }))
        });
    }

    const fullPortfolio = await prisma.portfolio.findUnique({
        where: { id: portfolio.id },
        include: {
            projects: {
                include: {
                    project: {
                        include: { owner: true, tasks: true }
                    }
                }
            },
            owner: true
        }
    });

    await eventBus.publish('app/portfolio.created', {
        portfolio: fullPortfolio,
        workspaceId,
        auditContext: {
            workspaceId,
            userId,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    try {
        await redisCache.del(`workspace:portfolios:${workspaceId}`);
    } catch {}

    return res.status(201).json({
        message: "Portfolio created successfully",
        portfolio: fullPortfolio
    });
});
