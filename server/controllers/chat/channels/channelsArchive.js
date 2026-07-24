import { prisma } from '../../../config/prisma.js';

// Archive / Unarchive Channel
export const archiveChannel = async (req, res) => {
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
        const canArchive = ['OWNER', 'ADMIN'].includes(userRole) || isCreator;

        if (!canArchive) {
            return res.status(403).json({ message: "You do not have permission to archive/unarchive this channel" });
        }

        const updatedChannel = await prisma.channel.update({
            where: { id: channelId },
            data: { isArchived: !channel.isArchived }
        });

        return res.json({ 
            channel: updatedChannel, 
            message: updatedChannel.isArchived ? "Channel archived successfully" : "Channel unarchived successfully" 
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};
