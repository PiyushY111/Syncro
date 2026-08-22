import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole, invalidateUserWorkspaceRoleCache } from "./checkPermissionHelper.js";
import { logAuditEvent } from "../../services/auditLogger.js";


export const updateMemberRole = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId, targetUserId, newRole } = req.body;

        if (!workspaceId || !targetUserId || !newRole) {
            return res.status(400).json({ message: "workspaceId, targetUserId, and newRole are required" });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true } } }
        });

        if (!workspace) return res.status(404).json({ message: "Workspace not found" });

        const callerMember = workspace.members.find((m) => m.userId === userId);
        const isCallerOwner = workspace.ownerId === userId || callerMember?.role === 'OWNER';
        const callerRole = isCallerOwner ? 'OWNER' : (callerMember?.customRole || callerMember?.role || 'MEMBER');

        const targetMember = workspace.members.find((m) => m.userId === targetUserId);
        if (!targetMember) {
            return res.status(404).json({ message: "Workspace member not found" });
        }

        const isTargetOwner = workspace.ownerId === targetMember.userId || targetMember.role === 'OWNER';

        // 1. Primary workspace creator owner cannot be demoted
        if (workspace.ownerId === targetMember.userId && newRole !== 'OWNER') {
            return res.status(403).json({ message: "Cannot demote the primary Workspace Owner." });
        }

        // 2. Role hierarchy restrictions
        if (!isCallerOwner) {
            if (isTargetOwner) {
                return res.status(403).json({ message: "Only the Workspace Owner can modify Owner roles." });
            }
            if (callerRole === 'ADMIN') {
                if (targetMember.role === 'ADMIN') {
                    return res.status(403).json({ message: "Admins cannot modify other Admins or Owner roles." });
                }
                if (newRole === 'OWNER') {
                    return res.status(403).json({ message: "Admins cannot promote members to Owner." });
                }
            } else if (callerRole === 'MANAGER') {
                if (['ADMIN', 'OWNER', 'MANAGER'].includes(targetMember.role)) {
                    return res.status(403).json({ message: "Managers can only modify Member or Viewer roles." });
                }
                if (['OWNER', 'ADMIN'].includes(newRole)) {
                    return res.status(403).json({ message: "Managers cannot promote members to Admin or Owner." });
                }
            } else {
                return res.status(403).json({ message: "You do not have permission to change member roles." });
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

        return res.status(200).json({
            message: "Member role updated successfully",
            member: {
                ...updatedMember,
                role: updatedMember.customRole || updatedMember.role
            }
        });
    } catch (error) {
        console.error("Error updating member role:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
