import { prisma } from '../../config/prisma.js';

const canManageChannel = async (channel, userId) => {
    if (!channel) return false;
    if (channel.creatorId === userId) return true;

    const workspace = await prisma.workspace.findUnique({
        where: { id: channel.workspaceId },
        select: { ownerId: true }
    });
    if (workspace?.ownerId === userId) return true;

    const member = await prisma.workspaceMember.findFirst({
        where: { workspaceId: channel.workspaceId, userId, role: { in: ['OWNER', 'ADMIN', 'MANAGER'] } }
    });
    return !!member;
};

export const updateChannelDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;
        const { name, description, iconUrl } = req.body;

        const channel = await prisma.channel.findUnique({ where: { id: channelId } });
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        const updated = await prisma.channel.update({
            where: { id: channelId },
            data: {
                name: name ? name.trim().toLowerCase().replace(/\s+/g, "-") : channel.name,
                description: description !== undefined ? description : channel.description,
                iconUrl: iconUrl !== undefined ? iconUrl : channel.iconUrl
            }
        });

        return res.json({ channel: updated, message: "Channel details updated" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const archiveChannel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;

        const channel = await prisma.channel.findUnique({ where: { id: channelId } });
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        if (!(await canManageChannel(channel, userId))) {
            return res.status(403).json({ message: "Only admins can archive channels" });
        }

        const updated = await prisma.channel.update({
            where: { id: channelId },
            data: { isArchived: true }
        });

        return res.json({ channel: updated, message: "Channel archived" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const deleteChannel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;

        const channel = await prisma.channel.findUnique({ where: { id: channelId } });
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        if (!(await canManageChannel(channel, userId))) {
            return res.status(403).json({ message: "Only admins can delete channels" });
        }

        await prisma.channel.delete({ where: { id: channelId } });
        return res.json({ message: "Channel deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};
