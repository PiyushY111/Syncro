import { prisma } from '../../../config/prisma.js';

export const updateMemberRole = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id: workspaceId, memberId } = req.params;
        const { role } = req.body;

        if (!['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true },
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const userMember = workspace.members.find((member) => member.userId === userId);
        const userRole = userMember?.role || (workspace.ownerId === userId ? 'OWNER' : 'MEMBER');

        const targetMember = workspace.members.find((member) => member.id === memberId);
        if (!targetMember) {
            return res.status(404).json({ message: "Member not found in this workspace" });
        }

        const roleHierarchy = { 'OWNER': 4, 'ADMIN': 3, 'MANAGER': 2, 'MEMBER': 1 };
        
        const canUpdate = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);
        if (!canUpdate) {
            return res.status(403).json({ message: "You do not have permission to manage member roles" });
        }

        if (roleHierarchy[targetMember.role] >= roleHierarchy[userRole] && targetMember.userId !== userId) {
            return res.status(403).json({ message: "You cannot change the role of a user with a higher or equal role" });
        }

        if (roleHierarchy[role] > roleHierarchy[userRole]) {
            return res.status(403).json({ message: "You cannot promote a member to a role higher than your own" });
        }

        if (targetMember.role === 'OWNER' && role !== 'OWNER') {
            if (workspace.ownerId === targetMember.userId) {
                return res.status(403).json({ message: "Cannot demote the primary Workspace Owner" });
            }
        }

        await prisma.workspaceMember.update({
            where: { id: memberId },
            data: { role },
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
