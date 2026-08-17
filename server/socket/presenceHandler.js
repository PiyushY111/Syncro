import { prisma } from "../config/prisma.js";
import { redisCache } from "../config/redis.js";

export const registerPresenceHandlers = (io, socket) => {
    const userId = socket.user.id;

    redisCache.set(`presence:${userId}`, JSON.stringify({ status: "online", lastSeen: Date.now() }), 300);

    // Auto-join workspace rooms and emit presence updates scoped to shared workspace members
    let userWorkspaceIds = [];
    (async () => {
        try {
            const [memberWorkspaces, ownedWorkspaces] = await Promise.all([
                prisma.workspaceMember.findMany({
                    where: { userId },
                    select: { workspaceId: true }
                }),
                prisma.workspace.findMany({
                    where: { ownerId: userId },
                    select: { id: true }
                })
            ]);
            userWorkspaceIds = [...new Set([
                ...memberWorkspaces.map(w => w.workspaceId),
                ...ownedWorkspaces.map(w => w.id)
            ])];

            userWorkspaceIds.forEach(wsId => {
                socket.join(`workspace:${wsId}`);
                io.to(`workspace:${wsId}`).emit("presence:update", { userId, status: "online" });
            });
        } catch (err) {
            console.error("Error auto-joining socket workspace rooms:", err);
        }
    })();

    socket.on("typing:start", ({ channelId, recipientId }) => {
        if (channelId) {
            socket.to(`channel:${channelId}`).emit("typing:display", { channelId, user: socket.user, isTyping: true });
        } else if (recipientId) {
            io.to(`user:${recipientId}`).emit("typing:display", { user: socket.user, isTyping: true });
        }
    });

    socket.on("typing:stop", ({ channelId, recipientId }) => {
        if (channelId) {
            socket.to(`channel:${channelId}`).emit("typing:display", { channelId, user: socket.user, isTyping: false });
        } else if (recipientId) {
            io.to(`user:${recipientId}`).emit("typing:display", { user: socket.user, isTyping: false });
        }
    });

    socket.on("disconnect", () => {
        redisCache.del(`presence:${userId}`);
        userWorkspaceIds.forEach(wsId => {
            io.to(`workspace:${wsId}`).emit("presence:update", { userId, status: "offline" });
        });
    });
};
