import crypto from 'crypto';
import { prisma } from "../config/prisma.js";
import { redisCache } from "../config/redis.js";
import { eventBus } from "../services/eventBus.js";

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

            await eventBus.publish('app/chat.message_sent', {
                message,
                channelId: channelId || null,
                recipientId: recipientId || null,
                senderName: socket.user.name
            });
            
            if (channelId) {
                redisCache.del(`messages:${channelId}`).catch(() => {});
            }
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

            await eventBus.publish('app/chat.message_deleted', {
                messageId,
                channelId: channelId || null,
                recipientId: message.recipientId
            });

            if (channelId) {
                redisCache.del(`messages:${channelId}`).catch(() => {});
            }
        } catch (error) {
            console.error("[SOCKET MESSAGE DELETE ERROR]", error);
        }
    });
};
