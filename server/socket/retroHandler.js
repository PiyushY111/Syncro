export const registerRetroHandlers = (io, socket) => {
    // Join retro board room
    socket.on("retro:join", (sprintId) => {
        if (sprintId) {
            socket.join(`sprint-${sprintId}`);
            console.log(`[RETRO JOIN] User ${socket.user.name} joined room: sprint-${sprintId}`);
        }
    });

    // Leave retro board room
    socket.on("retro:leave", (sprintId) => {
        if (sprintId) {
            socket.leave(`sprint-${sprintId}`);
            console.log(`[RETRO LEAVE] User ${socket.user.name} left room: sprint-${sprintId}`);
        }
    });
};
