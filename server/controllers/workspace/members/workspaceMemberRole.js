import { prisma } from '../../../config/prisma.js';
import { logAuditEvent } from '../../../services/auditLogger.js';

export const updateMemberRole = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id: workspaceId, memberId } = req.params;
        const { role, customRole } = req.body;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true } } },
        });

        if (!workspace) return res.status(404).json({ message: "Workspace not found" });

        const callerMember = workspace.members.find((m) => m.userId === userId);
        const isCallerOwner = workspace.ownerId === userId || callerMember?.role === 'OWNER';
        const callerRole = isCallerOwner ? 'OWNER' : (callerMember?.customRole || callerMember?.role || 'MEMBER');

        const targetMember = workspace.members.find((m) => m.id === memberId);
        if (!targetMember) return res.status(404).json({ message: "Member not found in this workspace" });

        const isTargetOwner = workspace.ownerId === targetMember.userId || targetMember.role === 'OWNER';

        // 1. Primary workspace creator owner cannot be demoted
        if (workspace.ownerId === targetMember.userId && role !== 'OWNER') {
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
                if (role === 'OWNER') {
                    return res.status(403).json({ message: "Admins cannot promote members to Owner." });
                }
            } else if (callerRole === 'MANAGER') {
                if (['ADMIN', 'OWNER', 'MANAGER'].includes(targetMember.role)) {
                    return res.status(403).json({ message: "Managers can only modify Member or Viewer roles." });
                }
                if (['OWNER', 'ADMIN'].includes(role)) {
                    return res.status(403).json({ message: "Managers cannot promote members to Admin or Owner." });
                }
            } else {
                return res.status(403).json({ message: "You do not have permission to manage member roles." });
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

        await logAuditEvent({
            workspaceId,
            userId,
            action: 'ROLE_CHANGE',
            entityType: 'USER',
            entityId: targetMember.userId,
            entityName: targetMember.user?.name || 'Member',
            severity: 'CRITICAL',
            previousState: { role: targetMember.customRole || targetMember.role },
            newState: { role: role || customRole },
            req
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
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};
