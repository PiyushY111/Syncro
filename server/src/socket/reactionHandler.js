import { prisma } from "../config/prisma.js";
import { invalidateChannelMessageCache } from "../controllers/chat/getMessages.js";
import logger from "../utils/logger/logger.js";

export const registerReactionHandlers = (io, socket) => {
    socket.on("reaction:add", async ({ messageId, emoji, channelId }) => {
        try {
            const reaction = await prisma.messageReaction.create({
                data: {
                    messageId,
                    userId: socket.user.id,
                    emoji
                },
                include: { user: { select: { id: true, name: true } } }
            });

            let targetChannelId = channelId;
            const rooms = channelId 
                ? [`channel:${channelId}`] 
                : await (async () => {
                    const msg = await prisma.message.findUnique({
                        where: { id: messageId },
                        select: { userId: true, recipientId: true, channelId: true }
                    });
                    if (!msg) return [];
                    if (msg.channelId) targetChannelId = msg.channelId;
                    const list = [`user:${msg.userId}`];
                    if (msg.recipientId) list.push(`user:${msg.recipientId}`);
                    if (msg.channelId) list.push(`channel:${msg.channelId}`);
                    return list;
                })();

            rooms.forEach(room => {
                io.to(room).emit("reaction:added", { messageId, reaction });
            });

            if (targetChannelId) {
                await invalidateChannelMessageCache(targetChannelId);
            }
        } catch (error) {
            logger.error("[SOCKET REACTION ADD ERROR]", { error: error.message, userId: socket.user.id, messageId });
        }
    });

    socket.on("reaction:remove", async ({ messageId, emoji, channelId }) => {
        try {
            await prisma.messageReaction.deleteMany({
                where: {
                    messageId,
                    userId: socket.user.id,
                    emoji
                }
            });

            let targetChannelId = channelId;
            const rooms = channelId 
                ? [`channel:${channelId}`] 
                : await (async () => {
                    const msg = await prisma.message.findUnique({
                        where: { id: messageId },
                        select: { userId: true, recipientId: true, channelId: true }
                    });
                    if (!msg) return [];
                    if (msg.channelId) targetChannelId = msg.channelId;
                    const list = [`user:${msg.userId}`];
                    if (msg.recipientId) list.push(`user:${msg.recipientId}`);
                    if (msg.channelId) list.push(`channel:${msg.channelId}`);
                    return list;
                })();

            rooms.forEach(room => {
                io.to(room).emit("reaction:removed", { messageId, emoji, userId: socket.user.id });
            });

            if (targetChannelId) {
                await invalidateChannelMessageCache(targetChannelId);
            }
        } catch (error) {
            logger.error("[SOCKET REACTION REMOVE ERROR]", { error: error.message, userId: socket.user.id, messageId });
        }
    });
};
