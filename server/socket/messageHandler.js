import crypto from 'crypto';
import { prisma } from "../config/prisma.js";
import { redisCache } from "../config/redis.js";

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

            if (channelId) {
                io.to(`channel:${channelId}`).emit("message:received", message);
                redisCache.del(`messages:${channelId}`).catch(() => {});

                // Parse mentions and create database notifications for mentioned users
                try {
                    const mentionNames = (content.match(/@\S+/g) || [])
                        .map(m => m.slice(1).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toLowerCase())
                        .filter(Boolean);
                    if (mentionNames.length > 0) {
                        const chan = await prisma.channel.findUnique({
                            where: { id: channelId },
                            select: { name: true, workspaceId: true }
                        });
                        if (chan) {
                            const workspaceMembers = await prisma.workspaceMember.findMany({
                                where: { workspaceId: chan.workspaceId },
                                include: { user: { select: { id: true, name: true } } }
                            });

                            const mentionedUsers = workspaceMembers
                                .map(m => m.user)
                                .filter(u => {
                                    if (!u || u.id === socket.user.id || !u.name) return false;
                                    const userWords = u.name.trim().toLowerCase().split(/\s+/).map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));
                                    return mentionNames.some(mention => 
                                        userWords.some(word => word === mention || word.startsWith(mention))
                                    );
                                });

                            for (const u of mentionedUsers) {
                                await prisma.notification.create({
                                    data: {
                                        userId: u.id,
                                        workspaceId: chan.workspaceId,
                                        type: 'COMMENT_MENTION',
                                        title: `${message.user.name} mentioned you in #${chan.name}`,
                                        content: content,
                                        entityType: 'CHAT',
                                        entityId: channelId,
                                        priority: 'HIGH'
                                    }
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error creating mention notification:", err);
                }
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
