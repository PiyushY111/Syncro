import { prisma } from '../../config/prisma.js';
import { redisCache } from '../../config/redis.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import logger from '../../utils/logger/logger.js';

// 1. Get direct messages (parent messages only)
export const getDirectMessages = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const dmKey = `messages:dm:${[userId, otherUserId].sort().join(':')}`;
    try {
        const cached = await redisCache.get(dmKey);
        if (cached) {
            const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
            return res.json({ messages: parsed, fromCache: true });
        }
    } catch (e) {
        logger.warn('[GET DM CACHE READ WARN]', { error: e.message });
    }

    const messages = await prisma.message.findMany({
        where: {
            parentId: null,
            OR: [
                { userId: userId, recipientId: otherUserId },
                { userId: otherUserId, recipientId: userId }
            ]
        },
        include: {
            user: { select: { id: true, name: true, email: true, image: true } },
            _count: {
                select: { replies: true }
            },
            reactions: { include: { user: { select: { id: true, name: true } } } }
        },
        orderBy: { createdAt: "asc" },
        take: 100
    });

    try {
        await redisCache.set(dmKey, JSON.stringify(messages), 60);
    } catch (e) {
        logger.warn('[GET DM CACHE SET WARN]', { error: e.message });
    }

    return res.json({ messages, fromCache: false });
});

// 2. Clear Direct Messages
export const clearDirectMessages = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    await prisma.message.deleteMany({
        where: {
            OR: [
                { userId: userId, recipientId: otherUserId },
                { userId: otherUserId, recipientId: userId }
            ]
        }
    });

    const dmKey = `messages:dm:${[userId, otherUserId].sort().join(':')}`;
    await redisCache.del(dmKey);

    if (global.io) {
        global.io.to(`user:${otherUserId}`).emit('direct:cleared', { otherUserId: userId });
        global.io.to(`user:${userId}`).emit('direct:cleared', { otherUserId });
    }

    return res.json({ message: "Direct message history cleared successfully" });
});

