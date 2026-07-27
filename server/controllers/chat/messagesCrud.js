import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { getIO } from '../../socket/socketInit.js';
import { redisCache } from '../../config/redis.js';
import { getUserWorkspaceRole } from '../role/checkPermissionHelper.js';

export const sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, channelId, recipientId, parentId } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Message content cannot be empty" });
        }

        // Authorization checks
        if (channelId) {
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
        } else if (recipientId) {
            const shareWorkspace = await prisma.workspaceMember.findFirst({
                where: {
                    userId,
                    workspace: {
                        OR: [
                            { ownerId: recipientId },
                            { members: { some: { userId: recipientId } } }
                        ]
                    }
                }
            }) || await prisma.workspace.findFirst({
                where: {
                    ownerId: userId,
                    OR: [
                        { ownerId: recipientId },
                        { members: { some: { userId: recipientId } } }
                    ]
                }
            });
            if (!shareWorkspace) {
                return res.status(403).json({ message: "You can only DM users sharing a workspace with you" });
            }
        }

        const contentHash = crypto.createHash('sha256').update(content.trim()).digest('hex');

        const message = await prisma.message.create({
            data: {
                content: content.trim(),
                contentHash,
                userId,
                channelId: channelId || null,
                recipientId: recipientId || null,
                parentId: parentId || null,
                type: "TEXT"
            },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } }
            }
        });

        try {
            const io = getIO();
            if (channelId) {
                io.to(`channel:${channelId}`).emit("message:received", message);
                redisCache.del(`messages:${channelId}`).catch(() => {});
            } else if (recipientId) {
                io.to(`user:${recipientId}`).to(`user:${userId}`).emit("message:received", message);
            }
        } catch (socketErr) {
            console.error("[HTTP SEND MESSAGE SOCKET EMIT ERROR]", socketErr);
        }

        return res.status(201).json({ message });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const pinMessage = async (req, res) => {
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
            if (!role) return res.status(403).json({ message: "Access restricted" });

            if (channel.isPrivate && !isOwner && role !== 'ADMIN' && channel.creatorId !== userId) {
                const isMember = channel.members.some(m => m.id === userId);
                if (!isMember) return res.status(403).json({ message: "Access restricted" });
            }
        } else {
            if (message.userId !== userId && message.recipientId !== userId) {
                return res.status(403).json({ message: "Access restricted" });
            }
        }

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: { isPinned: !message.isPinned, pinnedAt: !message.isPinned ? new Date() : null },
            include: { user: { select: { id: true, name: true, image: true } } }
        });

        return res.json({ message: updated, isPinned: updated.isPinned });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const getPinnedMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;

        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: { members: { select: { id: true } } }
        });
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        const { role, isOwner } = await getUserWorkspaceRole(userId, channel.workspaceId);
        if (!role) return res.status(403).json({ message: "Access restricted" });

        if (channel.isPrivate && !isOwner && role !== 'ADMIN' && channel.creatorId !== userId) {
            const isMember = channel.members.some(m => m.id === userId);
            if (!isMember) return res.status(403).json({ message: "Access restricted" });
        }

        const messages = await prisma.message.findMany({
            where: { channelId, isPinned: true },
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { pinnedAt: "desc" }
        });

        return res.json({ messages });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return res.status(404).json({ message: "Message not found" });
        if (message.userId !== userId) return res.status(403).json({ message: "Can only delete your own message" });

        await prisma.message.delete({ where: { id: messageId } });
        return res.json({ message: "Message deleted" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const searchMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { q } = req.query;

        if (!q || !q.trim()) {
            return res.json({ messages: [] });
        }

        const memberWorkspaces = await prisma.workspaceMember.findMany({
            where: { userId },
            select: { workspaceId: true }
        });
        const ownedWorkspaces = await prisma.workspace.findMany({
            where: { ownerId: userId },
            select: { id: true }
        });
        const wsIds = [...new Set([
            ...memberWorkspaces.map(w => w.workspaceId),
            ...ownedWorkspaces.map(w => w.id)
        ])];

        const messages = await prisma.message.findMany({
            where: {
                content: { contains: q.trim(), mode: "insensitive" },
                OR: [
                    {
                        channel: {
                            workspaceId: { in: wsIds },
                            OR: [
                                { isPrivate: false },
                                { members: { some: { id: userId } } },
                                { creatorId: userId }
                            ]
                        }
                    },
                    {
                        recipientId: userId
                    },
                    {
                        userId: userId,
                        recipientId: { not: null }
                    }
                ]
            },
            include: {
                user: { select: { id: true, name: true, image: true, email: true } },
                channel: { select: { id: true, name: true, workspaceId: true } },
                recipient: { select: { id: true, name: true, image: true, email: true } },
                reactions: { include: { user: { select: { id: true, name: true } } } }
            },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        return res.json({ messages });
    } catch (err) {
        console.error("[SEARCH MESSAGES ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};
