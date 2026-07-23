import { prisma } from '../../config/prisma.js';

// Add member to workspace explicitly
export const addMember = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, role, workspaceId } = req.body;
        const normalizedRole = role === 'org:admin' ? 'ADMIN' : 'MEMBER';

        const invitedUser = await prisma.user.findUnique({ where: { email: email?.toLowerCase() } });

        if (!invitedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!workspaceId || !role) {
            return res.status(400).json({ message: "Workspace ID and role are required" });
        }

        if (!['ADMIN', 'MEMBER'].includes(normalizedRole)) {
            return res.status(400).json({ message: "Invalid role. Must be 'ADMIN' or 'MEMBER'" });
        }

        const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, include: { members: true } });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const isAdmin = workspace.members.some((member) => member.userId === userId && member.role === 'ADMIN') || workspace.ownerId === userId;

        if (!isAdmin) {
            return res.status(401).json({ message: "Only Admins can add members to the workspace" });
        }

        const existingMember = workspace.members.find((member) => member.userId === invitedUser.id);

        if (existingMember) {
            return res.json({ member: existingMember, message: "User is already a member of the workspace" });
        }

        const member = await prisma.workspaceMember.create({
            data: {
                userId: invitedUser.id,
                workspaceId: workspaceId,
                role: normalizedRole,
                message: `${invitedUser.name} has been added as a ${normalizedRole.toLowerCase()} to the workspace ${workspace.name}`
            }
        });
        return res.json({ member, message: "Member added successfully" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};
