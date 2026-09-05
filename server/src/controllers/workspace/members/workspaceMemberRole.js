import { prisma } from '../../../config/prisma.js';
import { redisCache } from '../../../config/redis.js';
import { eventBus } from '../../../services/eventBus.js';
import { invalidateUserWorkspaceRoleCache } from '../../role/checkPermissionHelper.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { NotFoundError, ForbiddenError } from '../../../utils/errors/appError.js';

export const updateMemberRole = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id: workspaceId, memberId } = req.params;
    const { role, customRole } = req.body;

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { members: { include: { user: true } } },
    });

    if (!workspace) throw new NotFoundError("Workspace not found");

    const callerMember = workspace.members.find((m) => m.userId === userId);
    const isCallerOwner = workspace.ownerId === userId || callerMember?.role === 'OWNER';
    const callerRole = isCallerOwner ? 'OWNER' : (callerMember?.customRole || callerMember?.role || 'MEMBER');

    const targetMember = workspace.members.find((m) => m.id === memberId);
    if (!targetMember) throw new NotFoundError("Member not found in this workspace");

    const isTargetOwner = workspace.ownerId === targetMember.userId || targetMember.role === 'OWNER';

    // 1. Primary workspace creator owner cannot be demoted
    if (workspace.ownerId === targetMember.userId && role !== 'OWNER') {
        throw new ForbiddenError("Cannot demote the primary Workspace Owner.");
    }

    // 2. Role hierarchy restrictions
    if (!isCallerOwner) {
        if (isTargetOwner) {
            throw new ForbiddenError("Only the Workspace Owner can modify Owner roles.");
        }
        if (callerRole === 'ADMIN') {
            if (targetMember.role === 'ADMIN') {
                throw new ForbiddenError("Admins cannot modify other Admins or Owner roles.");
            }
            if (role === 'OWNER') {
                throw new ForbiddenError("Admins cannot promote members to Owner.");
            }
        } else if (callerRole === 'MANAGER') {
            if (['ADMIN', 'OWNER', 'MANAGER'].includes(targetMember.role)) {
                throw new ForbiddenError("Managers can only modify Member or Viewer roles.");
            }
            if (['OWNER', 'ADMIN'].includes(role)) {
                throw new ForbiddenError("Managers cannot promote members to Admin or Owner.");
            }
        } else {
            throw new ForbiddenError("You do not have permission to manage member roles.");
        }
    }

    const standardRoles = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];
    const isStandard = standardRoles.includes(role);

    const updateData = isStandard
        ? { role: role || 'MEMBER', customRole: customRole || '' }
        : { role: 'MEMBER', customRole: role || customRole || '' };

    await prisma.workspaceMember.update({
        where: { id: memberId },
        data: updateData,
    });

    await invalidateUserWorkspaceRoleCache(targetMember.userId, workspaceId);
    try {
        await redisCache.del(`user:workspaces:${targetMember.userId}`);
    } catch {}

    await eventBus.publish('app/workspace.member_role_changed', {
        workspaceId,
        memberId,
        targetUserId: targetMember.userId,
        targetUserName: targetMember.user?.name || 'Member',
        previousRole: targetMember.customRole || targetMember.role,
        newRole: role || customRole,
        auditContext: {
            workspaceId,
            userId,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

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

    return res.json({ workspace: updatedWorkspace, message: "Member role updated successfully" });
});
