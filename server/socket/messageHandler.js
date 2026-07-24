import crypto from 'crypto';
import { prisma } from "../config/prisma.js";
import { redisCache } from "../config/redis.js";

export const registerMessageHandlers = (io, socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on("channel:join", (channelId) => {
        if (channelId) socket.join(`channel:${channelId}`);
    });

    socket.on("channel:leave", (channelId) => {
        if (channelId) socket.leave(`channel:${channelId}`);
    });

    socket.on("message:send", async ({ channelId, recipientId, content, attachments = [], parentMessageId = null }) => {
        try {
            const contentHash = crypto.createHash('sha256').update(content || '').digest('hex');

            const message = await prisma.message.create({
                data: {
                    userId: socket.user.id,
                    channelId: channelId || null,
                    recipientId: recipientId || null,
                    content,
                    contentHash,
                    parentId: parentMessageId
                },
                include: {
                    user: { select: { id: true, name: true, email: true, image: true } }
                }
            });

            if (channelId) {
                io.to(`channel:${channelId}`).emit("message:received", message);
                redisCache.del(`messages:${channelId}`).catch(() => {});
            } else if (recipientId) {
                io.to(`user:${recipientId}`).to(`user:${socket.user.id}`).emit("message:received", message);
            }
        } catch (error) {
            console.error("[SOCKET MESSAGE SEND ERROR]", error);
            socket.emit("message:error", { message: "Failed to send message" });
        }
    });

    socket.on("message:delete", async ({ messageId, channelId }) => {
        try {
            await prisma.message.delete({ where: { id: messageId } });
            if (channelId) {
                io.to(`channel:${channelId}`).emit("message:deleted", { messageId });
                redisCache.del(`messages:${channelId}`).catch(() => {});
            }
        } catch (error) {
            console.error("[SOCKET MESSAGE DELETE ERROR]", error);
        }
    });
};
