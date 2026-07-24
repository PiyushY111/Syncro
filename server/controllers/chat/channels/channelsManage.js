import { prisma } from '../../../config/prisma.js';

export const updateChannel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;
        const { name, description } = req.body;

        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: { workspace: { include: { members: true } } }
        });

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        const workspaceMembers = channel.workspace.members;
        const userMember = workspaceMembers.find(m => m.userId === userId);
        const userRole = userMember?.role || (channel.workspace.ownerId === userId ? 'OWNER' : 'MEMBER');

        const isCreator = channel.creatorId === userId;
        const canManage = ['OWNER', 'ADMIN'].includes(userRole) || isCreator;

        if (!canManage) {
            return res.status(403).json({ message: "You do not have permission to edit channel details" });
        }

        const updated = await prisma.channel.update({
            where: { id: channelId },
            data: {
                name: name ? name.trim().toLowerCase().replace(/\s+/g, "-") : channel.name,
                description: description !== undefined ? description.trim() : channel.description
            }
        });

        return res.json({ channel: updated, message: "Channel details updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

export const deleteChannel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;
        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: { workspace: { include: { members: true } } }
        });

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        const workspaceMembers = channel.workspace.members;
        const userMember = workspaceMembers.find(m => m.userId === userId);
        const userRole = userMember?.role || (channel.workspace.ownerId === userId ? 'OWNER' : 'MEMBER');

        const isCreator = channel.creatorId === userId;
        const canDelete = ['OWNER', 'ADMIN'].includes(userRole) || isCreator;

        if (!canDelete) {
            return res.status(403).json({ message: "You do not have permission to delete this channel" });
        }

        await prisma.channel.delete({
            where: { id: channelId }
        });

        return res.json({ message: "Channel deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};
