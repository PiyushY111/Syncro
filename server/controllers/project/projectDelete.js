import { prisma } from '../../config/prisma.js';
import { hasWorkspacePermission } from '../role/checkPermissionHelper.js';
import { eventBus } from '../../services/eventBus.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors/appError.js';

// Delete Project
export const deleteProject = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const project = await prisma.project.findUnique({
        where: { id },
        include: { workspace: { include: { members: true } } }
    });

    if (!project) {
        throw new NotFoundError("Project not found");
    }

    const hasDeletePerm = await hasWorkspacePermission(userId, project.workspaceId, 'deleteProject');
    const canDelete = hasDeletePerm || project.team_lead === userId;

    if (!canDelete) {
        throw new ForbiddenError("You do not have permission to delete this project");
    }

    const previousState = { ...project };

    await prisma.project.delete({
        where: { id }
    });

    await eventBus.publish('app/project.deleted', {
        projectId: id,
        projectName: project.name,
        workspaceId: project.workspaceId,
        previousState,
        auditContext: {
            workspaceId: project.workspaceId,
            userId,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.json({ id, message: "Project deleted successfully" });
});
