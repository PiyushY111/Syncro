import { prisma } from "../../config/prisma.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";

const canManageSprints = async (userId, workspaceId) => {
    return await hasWorkspacePermission(userId, workspaceId, "editTasks");
};

export const updateCapacity = asyncHandler(async (req, res) => {
    const { sprintId } = req.params;
    const { userId, capacity } = req.body;

    if (!userId || capacity === undefined) {
        throw new BadRequestError("userId and capacity are required");
    }

    const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
        include: { project: true }
    });

    if (!sprint) throw new NotFoundError("Sprint not found");

    const hasPermission = await canManageSprints(req.user.id, sprint.project.workspaceId);
    if (!hasPermission) throw new ForbiddenError("You do not have permission to manage capacity");

    const sprintCapacity = await prisma.sprintCapacity.upsert({
        where: { sprintId_userId: { sprintId, userId } },
        update: { capacity: parseInt(capacity, 10) },
        create: { sprintId, userId, capacity: parseInt(capacity, 10) },
        include: { user: true }
    });

    return res.status(200).json({ message: "Capacity updated successfully", capacity: sprintCapacity });
});
