import logger from "../utils/logger/logger.js";

export const registerRetroHandlers = (io, socket) => {
    // Join retro board room
    socket.on("retro:join", (sprintId) => {
        if (sprintId) {
            socket.join(`sprint-${sprintId}`);
            logger.info(`[RETRO JOIN] User ${socket.user.name} joined room: sprint-${sprintId}`, { sprintId, userId: socket.user.id });
        }
    });

    // Leave retro board room
    socket.on("retro:leave", (sprintId) => {
        if (sprintId) {
            socket.leave(`sprint-${sprintId}`);
            logger.info(`[RETRO LEAVE] User ${socket.user.name} left room: sprint-${sprintId}`, { sprintId, userId: socket.user.id });
        }
    });
};
