import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole, invalidateUserWorkspaceRoleCache } from "./checkPermissionHelper.js";
import { logAuditEvent } from "../../services/auditLogger.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";
import { ApiResponse } from "../../utils/response/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const updateMemberRole = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { workspaceId, targetUserId, newRole } = req.body;

    if (!workspaceId || !targetUserId || !newRole) {
        throw new BadRequestError("workspaceId, targetUserId, and newRole are required");
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { members: { include: { user: true } } }
    });

    if (!workspace) throw new NotFoundError("Workspace not found");

    const callerMember = workspace.members.find((m) => m.userId === userId);
    const isCallerOwner = workspace.ownerId === userId || callerMember?.role === 'OWNER';
    const callerRole = isCallerOwner ? 'OWNER' : (callerMember?.customRole || callerMember?.role || 'MEMBER');

    const targetMember = workspace.members.find((m) => m.userId === targetUserId);
    if (!targetMember) {
        throw new NotFoundError("Workspace member not found");
    }

    const isTargetOwner = workspace.ownerId === targetMember.userId || targetMember.role === 'OWNER';

    // 1. Primary workspace creator owner cannot be demoted
    if (workspace.ownerId === targetMember.userId && newRole !== 'OWNER') {
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
            if (newRole === 'OWNER') {
                throw new ForbiddenError("Admins cannot promote members to Owner.");
            }
        } else if (callerRole === 'MANAGER') {
            if (['ADMIN', 'OWNER', 'MANAGER'].includes(targetMember.role)) {
                throw new ForbiddenError("Managers can only modify Member or Viewer roles.");
            }
            if (['OWNER', 'ADMIN'].includes(newRole)) {
                throw new ForbiddenError("Managers cannot promote members to Admin or Owner.");
            }
        } else {
            throw new ForbiddenError("You do not have permission to change member roles.");
        }
    }

    const standardRoles = ["ADMIN", "MANAGER", "MEMBER", "VIEWER"];
    const isStandard = standardRoles.includes(newRole);

    const updateData = isStandard
        ? { role: newRole, customRole: "" }
        : { role: "MEMBER", customRole: newRole };

    const updatedMember = await prisma.workspaceMember.update({
        where: { id: targetMember.id },
        data: updateData,
        include: { user: { select: { id: true, name: true, email: true, image: true } } }
    });

    await invalidateUserWorkspaceRoleCache(targetUserId, workspaceId);

    await logAuditEvent({
        workspaceId,
        userId,
        action: "ROLE_CHANGE",
        entityType: "USER",
        entityId: targetUserId,
        entityName: updatedMember.user?.name || "Member",
        severity: "CRITICAL",
        previousState: { role: targetMember.customRole || targetMember.role },
        newState: { role: newRole },
        req
    });

    return ApiResponse.success(res, {
        data: {
            member: {
                ...updatedMember,
                role: updatedMember.customRole || updatedMember.role
            }
        },
        message: "Member role updated successfully"
    });
});
