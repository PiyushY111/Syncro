import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole } from "../role/checkPermissionHelper.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BadRequestError, ForbiddenError } from "../../utils/errors/appError.js";

export const getEntityHistory = asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.params;

    if (!entityType || !entityId) {
        throw new BadRequestError("entityType and entityId are required");
    }

    const history = await prisma.auditLog.findMany({
        where: {
            entityType: entityType.toUpperCase(),
            entityId
        },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { createdAt: "desc" }
    });

    if (history.length > 0) {
        const { role, workspace } = await getUserWorkspaceRole(req.user.id, history[0].workspaceId);
        if (!workspace || !role) {
            throw new ForbiddenError("Access restricted to workspace members only");
        }
    }

    return res.status(200).json({ history });
});
