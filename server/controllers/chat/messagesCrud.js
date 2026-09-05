import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { eventBus } from '../../services/eventBus.js';
import { redisCache } from '../../config/redis.js';
import { getUserWorkspaceRole } from '../role/checkPermissionHelper.js';
import { invalidateChannelMessageCache } from './getMessages.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors/appError.js';
import logger from '../../utils/logger/logger.js';

export const sendMessage = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { content, channelId, recipientId, parentId } = req.body;

    if (!content || !content.trim()) {
        throw new BadRequestError("Message content cannot be empty");
    }

    // Authorization checks
    if (channelId) {
        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: { members: { select: { id: true } } }
        });
        if (!channel) {
            throw new NotFoundError("Channel not found");
        }

        const { role, isOwner } = await getUserWorkspaceRole(userId, channel.workspaceId);
        if (!role) {
            throw new ForbiddenError("Access restricted to workspace members only");
        }

        if (channel.isPrivate && !isOwner && role !== 'ADMIN' && channel.creatorId !== userId) {
            const isMember = channel.members.some(m => m.id === userId);
            if (!isMember) {
                throw new ForbiddenError("Access denied to private channel");
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
            throw new ForbiddenError("You can only DM users sharing a workspace with you");
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

    const formattedMessage = {
        ...message,
        reactions: [],
        _count: { replies: 0 }
    };

    if (channelId) {
        await invalidateChannelMessageCache(channelId);
    } else if (recipientId) {
        const dmKey = `messages:dm:${[userId, recipientId].sort().join(':')}`;
        await redisCache.del(dmKey);
    }

    // Instant broadcast if socket server is initialized
    if (global.io) {
        if (channelId) {
            global.io.to(`channel:${channelId}`).emit('message:received', formattedMessage);
        } else if (recipientId) {
            global.io.to(`user:${recipientId}`).emit('message:received', formattedMessage);
            global.io.to(`user:${userId}`).emit('message:received', formattedMessage);
        }
    }

    eventBus.publish('app/chat.message_sent', {
        message: formattedMessage,
        channelId: channelId || null,
        recipientId: recipientId || null,
        senderName: req.user.name
    }).catch(e => logger.warn("[EVENTBUS SEND MSG NON-BLOCKING ERR]", { error: e.message }));

    return res.status(201).json({ message: formattedMessage });
});

export const pinMessage = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { messageId } = req.params;
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
        throw new NotFoundError("Message not found");
    }

    if (message.channelId) {
        const channel = await prisma.channel.findUnique({
            where: { id: message.channelId },
            include: { members: { select: { id: true } } }
        });
        if (!channel) {
            throw new NotFoundError("Channel not found");
        }

        const { role, isOwner } = await getUserWorkspaceRole(userId, channel.workspaceId);
        if (!role) {
            throw new ForbiddenError("Access restricted");
        }

        if (channel.isPrivate && !isOwner && role !== 'ADMIN' && channel.creatorId !== userId) {
            const isMember = channel.members.some(m => m.id === userId);
            if (!isMember) {
                throw new ForbiddenError("Access restricted");
            }
        }
    } else {
        if (message.userId !== userId && message.recipientId !== userId) {
            throw new ForbiddenError("Access restricted");
        }
    }

    const updated = await prisma.message.update({
        where: { id: messageId },
        data: { isPinned: !message.isPinned, pinnedAt: !message.isPinned ? new Date() : null },
        include: { user: { select: { id: true, name: true, image: true } } }
    });

    if (message.channelId) {
        await invalidateChannelMessageCache(message.channelId);
        if (global.io) {
            global.io.to(`channel:${message.channelId}`).emit('message:pinned', { messageId, isPinned: updated.isPinned });
        }
    }

    return res.json({ message: updated, isPinned: updated.isPinned });
});

export const getPinnedMessages = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { channelId } = req.params;

    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { members: { select: { id: true } } }
    });
    if (!channel) {
        throw new NotFoundError("Channel not found");
    }

    const { role, isOwner } = await getUserWorkspaceRole(userId, channel.workspaceId);
    if (!role) {
        throw new ForbiddenError("Access restricted");
    }

    if (channel.isPrivate && !isOwner && role !== 'ADMIN' && channel.creatorId !== userId) {
        const isMember = channel.members.some(m => m.id === userId);
        if (!isMember) {
            throw new ForbiddenError("Access restricted");
        }
    }

    const messages = await prisma.message.findMany({
        where: { channelId, isPinned: true },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { pinnedAt: "desc" }
    });

    return res.json({ messages });
});

export const deleteMessage = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
        throw new NotFoundError("Message not found");
    }
    if (message.userId !== userId) {
        throw new ForbiddenError("Can only delete your own message");
    }

    await prisma.message.delete({ where: { id: messageId } });

    if (message.channelId) {
        await invalidateChannelMessageCache(message.channelId);
        if (global.io) {
            global.io.to(`channel:${message.channelId}`).emit('message:deleted', { messageId, channelId: message.channelId });
        }
    } else if (message.recipientId) {
        const dmKey = `messages:dm:${[userId, message.recipientId].sort().join(':')}`;
        await redisCache.del(dmKey);
        if (global.io) {
            global.io.to(`user:${message.recipientId}`).emit('message:deleted', { messageId });
            global.io.to(`user:${userId}`).emit('message:deleted', { messageId });
        }
    }

    eventBus.publish('app/chat.message_deleted', {
        messageId,
        channelId: message.channelId,
        recipientId: message.recipientId
    }).catch(e => logger.warn("[EVENTBUS DELETE MSG NON-BLOCKING ERR]", { error: e.message }));

    return res.json({ message: "Message deleted" });
});

export const searchMessages = asyncHandler(async (req, res) => {
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

    const queryTerm = q.trim().toLowerCase();

    const candidateMessages = await prisma.message.findMany({
        where: {
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
        take: 200
    });

    const messages = candidateMessages
        .filter(m => m.content && m.content.toLowerCase().includes(queryTerm))
        .slice(0, 50);

    return res.json({ messages });
});

