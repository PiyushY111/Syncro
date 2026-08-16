import { redisCache } from "../config/redis.js";

export const registerPresenceHandlers = (io, socket) => {
    const userId = socket.user.id;

    redisCache.set(`presence:${userId}`, JSON.stringify({ status: "online", lastSeen: Date.now() }), 300);
    io.emit("presence:update", { userId, status: "online" });

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
        io.emit("presence:update", { userId, status: "offline" });
    });
};
