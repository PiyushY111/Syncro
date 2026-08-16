import { prisma } from "../../config/prisma.js";
import { redisCache } from "../../config/redis.js";

export const invalidateChannelMessageCache = async (channelId) => {
    if (!channelId) return;
    try {
        await redisCache.del(`messages:${channelId}`);
        const versionKey = `channel:${channelId}:version`;
        await redisCache.incr(versionKey);
    } catch (e) {
        console.warn("[CHAT CACHE INVALIDATION ERROR]", e.message);
    }
};

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

        if (!channel) return res.status(404).json({ message: "Channel not found" });

        const isMember = channel.members.some(m => m.id === userId) || channel.creatorId === userId;
        const isWorkspaceMember = channel.workspace?.members.some(m => m.userId === userId) || channel.workspace?.ownerId === userId;

        if (!isWorkspaceMember && !isMember && channel.creatorId !== userId) {
            return res.status(403).json({ message: "Access restricted: not a workspace member" });
        }

        if (!isMember && channel.isPrivate && !isWorkspaceMember) {
            return res.status(403).json({ message: "Access restricted" });
        }

        // Version-based cache key lookup to prevent stale message cache
        const versionKey = `channel:${channelId}:version`;
        let version = await redisCache.get(versionKey);
        if (!version) {
            version = "1";
            await redisCache.set(versionKey, version, 86400 * 30);
        }

        const cacheKey = `messages:${channelId}:v${version}`;
        const cachedMessages = await redisCache.get(cacheKey);

        if (cachedMessages) {
            const parsed = typeof cachedMessages === 'string' ? JSON.parse(cachedMessages) : cachedMessages;
            return res.json({ messages: parsed, fromCache: true });
        }

        const messages = await prisma.message.findMany({
            where: { channelId, parentId: null },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
                _count: { select: { replies: true } },
                reactions: { include: { user: { select: { id: true, name: true } } } }
            },
            orderBy: { createdAt: "asc" },
            take: 100
        });

        await redisCache.set(cacheKey, JSON.stringify(messages), 300);
        return res.json({ messages, fromCache: false });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const getThreadReplies = async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;

        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) return res.status(404).json({ message: "Message not found" });

        if (message.channelId) {
            const channel = await prisma.channel.findUnique({
                where: { id: message.channelId },
                include: {
                    members: { select: { id: true } },
                    workspace: { include: { members: true } }
                }
            });
            if (!channel) return res.status(404).json({ message: "Channel not found" });

            const isMember = channel.members.some(m => m.id === userId) || channel.creatorId === userId;
            const isWorkspaceMember = channel.workspace?.members.some(m => m.userId === userId) || channel.workspace?.ownerId === userId;

            if (!isWorkspaceMember && !isMember && channel.creatorId !== userId) {
                return res.status(403).json({ message: "Access restricted" });
            }

            if (!isMember && channel.isPrivate && !isWorkspaceMember) {
                return res.status(403).json({ message: "Access restricted" });
            }
        } else {
            // DM
            if (message.userId !== userId && message.recipientId !== userId) {
                return res.status(403).json({ message: "Access restricted" });
            }
        }

        const replies = await prisma.message.findMany({
            where: { parentId: messageId },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
                reactions: { include: { user: { select: { id: true, name: true } } } }
            },
            orderBy: { createdAt: "asc" }
        });
        return res.json({ replies });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};
