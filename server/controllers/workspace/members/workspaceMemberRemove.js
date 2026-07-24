import { prisma } from '../../../config/prisma.js';

export const removeMember = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id: workspaceId, memberId } = req.params;

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

        if (workspace.ownerId === targetMember.userId) {
            return res.status(403).json({ message: "Cannot remove the primary Workspace Owner" });
        }

        const roleHierarchy = { 'OWNER': 4, 'ADMIN': 3, 'MANAGER': 2, 'MEMBER': 1 };

        const isSelf = targetMember.userId === userId;
        const canRemove = isSelf || ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);

        if (!canRemove) {
            return res.status(403).json({ message: "You do not have permission to remove members from this workspace" });
        }

        if (!isSelf && roleHierarchy[targetMember.role] >= roleHierarchy[userRole]) {
            return res.status(403).json({ message: "You cannot remove a user with a higher or equal role" });
        }

        await prisma.workspaceMember.delete({
            where: { id: memberId },
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

        return res.json({ workspace: updatedWorkspace, message: "Member removed successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};
