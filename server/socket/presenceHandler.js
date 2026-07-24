import { redisCache } from "../config/redis.js";

const onlineUsers = new Map();

export const registerPresenceHandlers = (io, socket) => {
    const userId = socket.user.id;
    onlineUsers.set(userId, { socketId: socket.id, user: socket.user });

    redisCache.set(`presence:${userId}`, "online", 300);
    io.emit("presence:update", { userId, status: "online", onlineUsers: Array.from(onlineUsers.keys()) });

    socket.on("typing:start", ({ channelId, recipientId }) => {
        if (channelId) {
            socket.to(`channel:${channelId}`).emit("typing:display", { channelId, user: socket.user, isTyping: true });
        } else if (recipientId) {
            const recipientSocket = onlineUsers.get(recipientId);
            if (recipientSocket) {
                io.to(recipientSocket.socketId).emit("typing:display", { user: socket.user, isTyping: true });
            }
        }
    });

    socket.on("typing:stop", ({ channelId, recipientId }) => {
        if (channelId) {
            socket.to(`channel:${channelId}`).emit("typing:display", { channelId, user: socket.user, isTyping: false });
        } else if (recipientId) {
            const recipientSocket = onlineUsers.get(recipientId);
            if (recipientSocket) {
                io.to(recipientSocket.socketId).emit("typing:display", { user: socket.user, isTyping: false });
            }
        }
    });

    socket.on("disconnect", () => {
        onlineUsers.delete(userId);
        redisCache.del(`presence:${userId}`);
        io.emit("presence:update", { userId, status: "offline", onlineUsers: Array.from(onlineUsers.keys()) });
    });
};
