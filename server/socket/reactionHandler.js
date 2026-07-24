import { prisma } from "../config/prisma.js";

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

            io.to(`channel:${channelId}`).emit("reaction:added", { messageId, reaction });
        } catch (error) {
            console.error("[SOCKET REACTION ADD ERROR]", error);
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

            io.to(`channel:${channelId}`).emit("reaction:removed", { messageId, emoji, userId: socket.user.id });
        } catch (error) {
            console.error("[SOCKET REACTION REMOVE ERROR]", error);
        }
    });
};
