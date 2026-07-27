import { prisma } from '../../config/prisma.js';
import { getUserWorkspaceRole, hasWorkspacePermission } from '../role/checkPermissionHelper.js';

export const clearChannelChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;

        const channel = await prisma.channel.findUnique({ where: { id: channelId } });
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        const { role, isOwner } = await getUserWorkspaceRole(userId, channel.workspaceId);
        if (!role) return res.status(403).json({ message: "Access restricted to workspace members only" });

        const isCreator = channel.creatorId === userId;
        const canManage = isOwner || role === 'ADMIN' || await hasWorkspacePermission(userId, channel.workspaceId, 'manageChannels');
        if (!isCreator && !canManage) {
            return res.status(403).json({ message: "Only channel creator or admins can clear chat history" });
        }

        await prisma.message.deleteMany({
            where: { channelId }
        });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        await prisma.message.create({
            data: { content: `${user.name} cleared the channel chat history`, userId, channelId, type: "SYSTEM" }
        });

        return res.json({ message: "Channel chat history cleared successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const exportChannelChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;

        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: { members: { select: { id: true } } }
        });
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        const { role, isOwner } = await getUserWorkspaceRole(userId, channel.workspaceId);
        if (!role) return res.status(403).json({ message: "Access restricted to workspace members only" });

        if (channel.isPrivate && !isOwner && role !== 'ADMIN' && channel.creatorId !== userId) {
            const isMember = channel.members.some(m => m.id === userId);
            if (!isMember) {
                return res.status(403).json({ message: "Access denied to private channel" });
            }
        }

        const messages = await prisma.message.findMany({
            where: { channelId },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: "asc" }
        });

        let transcript = `=========================================\nSYNCRO CHAT EXPORT - #${channel.name.toUpperCase()}\nExported Date: ${new Date().toLocaleString()}\n=========================================\n\n`;

        messages.forEach(m => {
            const time = new Date(m.createdAt).toLocaleString();
            const sender = m.user?.name || "System";
            transcript += `[${time}] ${sender}: ${m.content}\n`;
        });

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${channel.name}-chat-export.txt"`);
        return res.send(transcript);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const toggleStarMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return res.status(404).json({ message: "Message not found" });

        if (message.channelId) {
            const channel = await prisma.channel.findUnique({
                where: { id: message.channelId },
                include: { members: { select: { id: true } } }
            });
            if (!channel) return res.status(404).json({ message: "Channel not found" });

            const { role, isOwner } = await getUserWorkspaceRole(userId, channel.workspaceId);
            if (!role) return res.status(403).json({ message: "Access restricted to workspace members only" });

            if (channel.isPrivate && !isOwner && role !== 'ADMIN' && channel.creatorId !== userId) {
                const isMember = channel.members.some(m => m.id === userId);
                if (!isMember) {
                    return res.status(403).json({ message: "Access denied to private channel" });
                }
            }
        } else {
            if (message.userId !== userId && message.recipientId !== userId) {
                return res.status(403).json({ message: "Access denied" });
            }
        }

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: { isStarred: !message.isStarred }
        });

        return res.json({ message: updated, isStarred: updated.isStarred });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const getStarredMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;

        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: { members: { select: { id: true } } }
        });
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        const { role, isOwner } = await getUserWorkspaceRole(userId, channel.workspaceId);
        if (!role) return res.status(403).json({ message: "Access restricted to workspace members only" });

        if (channel.isPrivate && !isOwner && role !== 'ADMIN' && channel.creatorId !== userId) {
            const isMember = channel.members.some(m => m.id === userId);
            if (!isMember) {
                return res.status(403).json({ message: "Access denied to private channel" });
            }
        }

        const messages = await prisma.message.findMany({
            where: { channelId, isStarred: true },
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: "desc" }
        });

        return res.json({ messages });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};
