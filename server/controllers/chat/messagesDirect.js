import { prisma } from '../../config/prisma.js';
import { redisCache } from '../../config/redis.js';

// 1. Get direct messages (parent messages only)
export const getDirectMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;

        const dmKey = `messages:dm:${[userId, otherUserId].sort().join(':')}`;
        try {
            const cached = await redisCache.get(dmKey);
            if (cached) {
                const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
                return res.json({ messages: parsed, fromCache: true });
            }
        } catch {}

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
        } catch {}

        return res.json({ messages, fromCache: false });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

// 2. Clear Direct Messages
export const clearDirectMessages = async (req, res) => {
    try {
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
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};
