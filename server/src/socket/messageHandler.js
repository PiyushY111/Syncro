import crypto from 'crypto';
import { prisma } from "../config/prisma.js";
import { redisCache } from "../config/redis.js";
import { eventBus } from "../services/eventBus.js";
import { invalidateChannelMessageCache } from "../controllers/chat/getMessages.js";
import logger from "../utils/logger/logger.js";

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
            logger.error("Error auto-joining socket channels:", { error: err.message, userId: socket.user.id });
        }
    })();

    socket.on("channel:join", async (channelId) => {
        if (!channelId) return;
        try {
            const channel = await prisma.channel.findUnique({
                where: { id: channelId },
                include: {
                    members: { select: { id: true } },
                    workspace: { select: { ownerId: true, members: { select: { userId: true } } } }
                }
            });
            if (!channel) return;

            const isWorkspaceMember =
                channel.workspace?.ownerId === socket.user.id ||
                channel.workspace?.members?.some((m) => m.userId === socket.user.id);

            if (!isWorkspaceMember) return;

            if (
                channel.isPrivate &&
                channel.creatorId !== socket.user.id &&
                !channel.members?.some((m) => m.id === socket.user.id) &&
                channel.workspace?.ownerId !== socket.user.id
            ) {
                return;
            }

            socket.join(`channel:${channelId}`);
        } catch (err) {
            logger.error("[SOCKET CHANNEL JOIN AUTH ERROR]", { error: err.message, userId: socket.user.id, channelId });
        }
    });

    socket.on("channel:leave", (channelId) => {
        if (channelId) socket.leave(`channel:${channelId}`);
    });

    socket.on("message:send", async ({ channelId, recipientId, content, attachments = [], parentMessageId = null }) => {
        try {
            if (!content || !content.trim()) {
                return socket.emit("message:error", { message: "Message content cannot be empty" });
            }

            // Authorization Checks
            if (channelId) {
                const channel = await prisma.channel.findUnique({
                    where: { id: channelId },
                    include: {
                        members: { select: { id: true } },
                        workspace: { select: { ownerId: true, members: { select: { userId: true } } } }
                    }
                });
                if (!channel) {
                    return socket.emit("message:error", { message: "Channel not found" });
                }

                const isWorkspaceMember =
                    channel.workspace?.ownerId === socket.user.id ||
                    channel.workspace?.members?.some((m) => m.userId === socket.user.id);

                if (!isWorkspaceMember) {
                    return socket.emit("message:error", { message: "Access denied to channel" });
                }

                if (
                    channel.isPrivate &&
                    channel.creatorId !== socket.user.id &&
                    !channel.members?.some((m) => m.id === socket.user.id) &&
                    channel.workspace?.ownerId !== socket.user.id
                ) {
                    return socket.emit("message:error", { message: "Access denied to private channel" });
                }
            } else if (recipientId) {
                const shareWorkspace = await prisma.workspaceMember.findFirst({
                    where: {
                        userId: socket.user.id,
                        workspace: {
                            OR: [
                                { ownerId: recipientId },
                                { members: { some: { userId: recipientId } } }
                            ]
                        }
                    }
                }) || await prisma.workspace.findFirst({
                    where: {
                        ownerId: socket.user.id,
                        OR: [
                            { ownerId: recipientId },
                            { members: { some: { userId: recipientId } } }
                        ]
                    }
                });

                if (!shareWorkspace) {
                    return socket.emit("message:error", { message: "You can only message users who share a workspace with you" });
                }
            } else {
                return socket.emit("message:error", { message: "Either channelId or recipientId must be provided" });
            }

            const contentHash = crypto.createHash('sha256').update(content.trim()).digest('hex');

            const message = await prisma.message.create({
                data: {
                    userId: socket.user.id,
                    channelId: channelId || null,
                    recipientId: recipientId || null,
                    content: content.trim(),
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

            // 1. Instant broadcast to socket rooms
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
            }).catch(e => logger.warn("[EVENTBUS CHAT MSG SENT NON-BLOCKING ERR]", { error: e.message, userId: socket.user.id }));

        } catch (error) {
            logger.error("[SOCKET MESSAGE SEND ERROR]", { error: error.message, userId: socket.user.id });
            socket.emit("message:error", { message: "Failed to send message" });
        }
    });

    socket.on("message:delete", async ({ messageId, channelId }) => {
        try {
            const message = await prisma.message.findUnique({
                where: { id: messageId },
                include: {
                    channel: { select: { workspaceId: true, workspace: { select: { ownerId: true } } } }
                }
            });
            if (!message) return;

            // Authorization: Message owner or workspace owner
            const isOwner = message.userId === socket.user.id;
            const isWorkspaceOwner = message.channel?.workspace?.ownerId === socket.user.id;
            if (!isOwner && !isWorkspaceOwner) {
                return socket.emit("message:error", { message: "Unauthorized to delete this message" });
            }

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
            }).catch(e => logger.warn("[EVENTBUS CHAT MSG DELETED NON-BLOCKING ERR]", { error: e.message, userId: socket.user.id }));

        } catch (error) {
            logger.error("[SOCKET MESSAGE DELETE ERROR]", { error: error.message, userId: socket.user.id });
        }
    });
};
