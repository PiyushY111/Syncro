import crypto from 'crypto';
import { prisma } from "../config/prisma.js";
import { redisCache } from "../config/redis.js";
import { eventBus } from "../services/eventBus.js";
import { invalidateChannelMessageCache } from "../controllers/chat/getMessages.js";

export const registerMessageHandlers = (io, socket) => {
    socket.join(`user:${socket.user.id}`);

    // Join all channels (public in user's workspaces, or user is member/creator) for global unread notifications
    (async () => {
        try {
            const memberWorkspaces = await prisma.workspaceMember.findMany({
                where: { userId: socket.user.id },
                select: { workspaceId: true }
            });
            const ownedWorkspaces = await prisma.workspace.findMany({
                where: { ownerId: socket.user.id },
                select: { id: true }
            });
            const wsIds = [...new Set([
                ...memberWorkspaces.map(w => w.workspaceId),
                ...ownedWorkspaces.map(w => w.id)
            ])];

            const chans = await prisma.channel.findMany({
                where: {
                    OR: [
                        { workspaceId: { in: wsIds }, isPrivate: false },
                        { members: { some: { id: socket.user.id } } },
                        { creatorId: socket.user.id }
                    ]
                },
                select: { id: true }
            });

            chans.forEach(ch => {
                socket.join(`channel:${ch.id}`);
            });
        } catch (err) {
            console.error("Error auto-joining socket channels:", err);
        }
    })();

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

            const formattedMessage = {
                ...message,
                reactions: [],
                _count: { replies: 0 }
            };

            // 1. Instant ultra-low-latency broadcast to socket rooms (0ms)
            if (channelId) {
                io.to(`channel:${channelId}`).emit("message:received", formattedMessage);
                await invalidateChannelMessageCache(channelId);
            } else if (recipientId) {
                io.to(`user:${recipientId}`).emit("message:received", formattedMessage);
                io.to(`user:${socket.user.id}`).emit("message:received", formattedMessage);
                const dmKey = `messages:dm:${[socket.user.id, recipientId].sort().join(':')}`;
                await redisCache.del(dmKey);
            }

            // 2. Publish async domain event for notifications, email alerts & mentions (non-blocking)
            eventBus.publish('app/chat.message_sent', {
                message: formattedMessage,
                channelId: channelId || null,
                recipientId: recipientId || null,
                senderName: socket.user.name
            }).catch(e => console.warn("[EVENTBUS CHAT MSG SENT NON-BLOCKING ERR]", e.message));

        } catch (error) {
            console.error("[SOCKET MESSAGE SEND ERROR]", error);
            socket.emit("message:error", { message: "Failed to send message" });
        }
    });

    socket.on("message:delete", async ({ messageId, channelId }) => {
        try {
            const message = await prisma.message.findUnique({ where: { id: messageId } });
            if (!message) return;

            await prisma.message.delete({ where: { id: messageId } });

            const targetChannelId = channelId || message.channelId;

            // Instant broadcast to socket rooms
            if (targetChannelId) {
                io.to(`channel:${targetChannelId}`).emit("message:deleted", { messageId, channelId: targetChannelId });
                await invalidateChannelMessageCache(targetChannelId);
            } else if (message.recipientId) {
                io.to(`user:${message.recipientId}`).emit("message:deleted", { messageId });
                io.to(`user:${socket.user.id}`).emit("message:deleted", { messageId });
                const dmKey = `messages:dm:${[socket.user.id, message.recipientId].sort().join(':')}`;
                await redisCache.del(dmKey);
            }

            eventBus.publish('app/chat.message_deleted', {
                messageId,
                channelId: targetChannelId || null,
                recipientId: message.recipientId
            }).catch(e => console.warn("[EVENTBUS CHAT MSG DELETED NON-BLOCKING ERR]", e.message));

        } catch (error) {
            console.error("[SOCKET MESSAGE DELETE ERROR]", error);
        }
    });
};
