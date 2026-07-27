import { prisma } from '../../config/prisma.js';
import { getUserWorkspaceRole } from '../role/checkPermissionHelper.js';

export const addMemberToChannel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;
        const { memberUserId } = req.body;

        if (!memberUserId) return res.status(400).json({ message: "memberUserId is required" });

        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: { members: { select: { id: true } } }
        });

        if (!channel) return res.status(404).json({ message: "Channel not found" });

        const isMember = channel.members.some(m => m.id === userId) || channel.creatorId === userId;
        if (!isMember) return res.status(403).json({ message: "You must be a channel member to invite others" });

        const targetUserRole = await getUserWorkspaceRole(memberUserId, channel.workspaceId);
        if (!targetUserRole.role) {
            return res.status(400).json({ message: "User is not a member of this workspace and cannot be added to this channel" });
        }

        const updated = await prisma.channel.update({
            where: { id: channelId },
            data: { members: { connect: { id: memberUserId } } },
            include: { members: { select: { id: true, name: true, email: true, image: true } } }
        });

        const addedUser = await prisma.user.findUnique({ where: { id: memberUserId } });
        const inviter = await prisma.user.findUnique({ where: { id: userId } });

        await prisma.message.create({
            data: { content: `${inviter.name} added ${addedUser?.name || 'a member'} to the channel`, userId, channelId, type: "SYSTEM" }
        });

        return res.json({ channel: updated, message: "Member added to channel successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const removeMemberFromChannel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId, memberUserId } = req.params;

        const channel = await prisma.channel.findUnique({ where: { id: channelId } });
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        if (channel.creatorId !== userId && userId !== memberUserId) {
            return res.status(403).json({ message: "Only the channel creator can remove members" });
        }

        const updated = await prisma.channel.update({
            where: { id: channelId },
            data: { members: { disconnect: { id: memberUserId } } },
            include: { members: { select: { id: true, name: true, email: true, image: true } } }
        });

        const removedUser = await prisma.user.findUnique({ where: { id: memberUserId } });
        await prisma.message.create({
            data: { content: `${removedUser?.name || 'A member'} left the channel`, userId: memberUserId, channelId, type: "SYSTEM" }
        });

        return res.json({ channel: updated, message: "Member removed from channel" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};
