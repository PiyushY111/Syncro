import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { socketAuthMiddleware } from "./socketAuthMiddleware.js";
import { registerPresenceHandlers } from "./presenceHandler.js";
import { registerMessageHandlers } from "./messageHandler.js";
import { registerReactionHandlers } from "./reactionHandler.js";
import { registerWhiteboardHandlers } from "./whiteboardHandler.js";
import { registerRetroHandlers } from "./retroHandler.js";

let ioInstance = null;

export const initSocketIO = (httpServer) => {
    ioInstance = new SocketIOServer(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ["polling", "websocket"],
        allowEIO3: true
    });

    // Attach Redis Adapter for horizontal multi-node scaling when REDIS_URL or UPSTASH_REDIS_TCP_URL is present
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_TCP_URL;
    if (redisUrl) {
        try {
            const pubClient = new Redis(redisUrl, { maxRetriesPerRequest: null });
            const subClient = pubClient.duplicate();

            pubClient.on("error", (err) => console.warn("[SOCKET REDIS PUB ERROR]", err.message));
            subClient.on("error", (err) => console.warn("[SOCKET REDIS SUB ERROR]", err.message));

            ioInstance.adapter(createAdapter(pubClient, subClient));
            console.log("[SOCKET.IO] Redis adapter attached successfully for multi-instance scaling.");
        } catch (err) {
            console.warn("[SOCKET.IO REDIS ADAPTER WARN] Failed to attach Redis adapter:", err.message);
        }
    } else {
        console.log("[SOCKET.IO] REDIS_URL not configured. Running with in-memory adapter (single instance mode).");
    }

    global.io = ioInstance;

    ioInstance.use(socketAuthMiddleware);

    ioInstance.on("connection", (socket) => {
        console.log(`[SOCKET CONNECTED] User: ${socket.user.name} (${socket.user.id})`);

        // Join individual user room for cross-instance direct targeting
        socket.join(`user:${socket.user.id}`);

        registerPresenceHandlers(ioInstance, socket);
        registerMessageHandlers(ioInstance, socket);
        registerReactionHandlers(ioInstance, socket);
        registerWhiteboardHandlers(ioInstance, socket);
        registerRetroHandlers(ioInstance, socket);
    });

    return ioInstance;
};

export const getIO = () => {
    if (!ioInstance) {
        throw new Error("Socket.IO instance has not been initialized!");
    }
    return ioInstance;
};
