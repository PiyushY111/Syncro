import { Server as SocketIOServer } from "socket.io";
import { socketAuthMiddleware } from "./socketAuthMiddleware.js";
import { registerPresenceHandlers } from "./presenceHandler.js";
import { registerMessageHandlers } from "./messageHandler.js";
import { registerReactionHandlers } from "./reactionHandler.js";
import { registerWhiteboardHandlers } from "./whiteboardHandler.js";

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

    ioInstance.use(socketAuthMiddleware);

    ioInstance.on("connection", (socket) => {
        console.log(`[SOCKET CONNECTED] User: ${socket.user.name} (${socket.user.id})`);

        registerPresenceHandlers(ioInstance, socket);
        registerMessageHandlers(ioInstance, socket);
        registerReactionHandlers(ioInstance, socket);
        registerWhiteboardHandlers(ioInstance, socket);
    });

    return ioInstance;
};

export const getIO = () => {
    if (!ioInstance) {
        throw new Error("Socket.IO instance has not been initialized!");
    }
    return ioInstance;
};
