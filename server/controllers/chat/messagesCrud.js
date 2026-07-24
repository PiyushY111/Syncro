import { prisma } from '../../config/prisma.js';

// 1. Send message (Channel, DM, or Thread Reply)
export const sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, channelId, recipientId, parentId } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Message content cannot be empty" });
        }

        if (channelId) {
            const channel = await prisma.channel.findUnique({
                where: { id: channelId },
                include: {
                    members: { select: { id: true } },
                    workspace: { include: { members: true } }
                }
            });
            if (channel?.isArchived) {
                return res.status(400).json({ message: "Cannot send messages to an archived channel" });
            }
            const isMember = channel?.members.some(m => m.id === userId) || channel?.creatorId === userId;
            const isWorkspaceMember = channel?.workspace?.members.some(m => m.userId === userId) || channel?.workspace?.ownerId === userId;
            const isPublicChannel = channel && !channel.isPrivate && isWorkspaceMember;

            if (!isMember && !isPublicChannel) {
                return res.status(403).json({ message: "You must join this channel to send messages" });
            }
        }

        const message = await prisma.message.create({
            data: {
                content: content.trim(),
                userId,
                channelId,
                recipientId,
                parentId,
                type: "TEXT"
            },
            include: {
                user: true
            }
        });

        return res.status(201).json({ message });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

// 2. Get channel messages (parent messages only)
export const getChannelMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;

        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: {
                members: { select: { id: true } },
                workspace: { include: { members: true } }
            }
        });

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        const isMember = channel.members.some(m => m.id === userId) || channel.creatorId === userId;
        const isWorkspaceMember = channel.workspace?.members.some(m => m.userId === userId) || channel.workspace?.ownerId === userId;
        const isPublicChannel = !channel.isPrivate && isWorkspaceMember;

        if (!isMember && !isPublicChannel) {
            return res.status(403).json({ message: "You must join this channel to view its message history", isNotMember: true });
        }

        const messages = await prisma.message.findMany({
            where: {
                channelId,
                parentId: null
            },
            include: {
                user: true,
                _count: {
                    select: { replies: true }
                }
            },
            orderBy: { createdAt: "asc" }
        });
        return res.json({ messages });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

// 3. Get thread replies
export const getThreadReplies = async (req, res) => {
    try {
        const { messageId } = req.params;
        const replies = await prisma.message.findMany({
            where: { parentId: messageId },
            include: { user: true },
            orderBy: { createdAt: "asc" }
        });
        return res.json({ replies });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};
