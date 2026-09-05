import { prisma } from '../../../config/prisma.js';
import { redisCache } from '../../../config/redis.js';
import { invalidateUserWorkspaceRoleCache } from '../../role/checkPermissionHelper.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { NotFoundError, ForbiddenError } from '../../../utils/errors/appError.js';

export const removeMember = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id: workspaceId, memberId } = req.params;

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { members: true },
    });

    if (!workspace) {
        throw new NotFoundError("Workspace not found");
    }

    const userMember = workspace.members.find((member) => member.userId === userId);
    const userRole = userMember?.role || (workspace.ownerId === userId ? 'OWNER' : 'MEMBER');

    const targetMember = workspace.members.find((member) => member.id === memberId);
    if (!targetMember) {
        throw new NotFoundError("Member not found in this workspace");
    }

    if (workspace.ownerId === targetMember.userId) {
        throw new ForbiddenError("Cannot remove the primary Workspace Owner");
    }

    const roleHierarchy = { 'OWNER': 4, 'ADMIN': 3, 'MANAGER': 2, 'MEMBER': 1 };

    const isSelf = targetMember.userId === userId;
    const canRemove = isSelf || ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);

    if (!canRemove) {
        throw new ForbiddenError("You do not have permission to remove members from this workspace");
    }

    if (!isSelf && roleHierarchy[targetMember.role] >= roleHierarchy[userRole]) {
        throw new ForbiddenError("You cannot remove a user with a higher or equal role");
    }

    await prisma.workspaceMember.delete({
        where: { id: memberId },
    });

    await invalidateUserWorkspaceRoleCache(targetMember.userId, workspaceId);
    try {
        await redisCache.del(`user:workspaces:${targetMember.userId}`);
    } catch {}

    const updatedWorkspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
            owner: true,
            members: { include: { user: true } },
            projects: {
                include: {
                    tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } },
                    members: { include: { user: true } },
                },
            },
        },
    });

    return res.json({ workspace: updatedWorkspace, message: "Member removed successfully" });
});
