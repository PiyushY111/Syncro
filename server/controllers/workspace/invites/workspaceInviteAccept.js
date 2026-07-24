import { prisma } from '../../../config/prisma.js';
import { verifyInvitationToken } from '../workspaceHelpers.js';

export const acceptWorkspaceInvitation = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentEmail = req.user.email;
        const { token } = req.body;

        const invitation = verifyInvitationToken(token);

        if (!invitation) {
            return res.status(400).json({ message: "Invitation link is invalid or has expired" });
        }

        if (currentEmail && currentEmail.toLowerCase() !== invitation.email) {
            return res.status(403).json({ message: "Please sign in with the invited email address" });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: invitation.workspaceId },
            include: { members: true },
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const existingMember = workspace.members.find((member) => member.userId === user.id);

        if (existingMember) {
            return res.json({ message: "You are already a member of this workspace", workspaceId: workspace.id });
        }

        await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId: workspace.id,
                role: invitation.role,
                message: `${user.name} joined the workspace ${workspace.name} through an invitation`,
            },
        });

        return res.json({ message: "Invitation accepted successfully", workspaceId: workspace.id });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};
