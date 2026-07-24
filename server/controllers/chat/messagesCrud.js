import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { getIO } from '../../socket/socketInit.js';
import { redisCache } from '../../config/redis.js';

export const sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, channelId, recipientId, parentId } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Message content cannot be empty" });
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
        const { messageId } = req.params;
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return res.status(404).json({ message: "Message not found" });

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
        const { channelId } = req.params;
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
