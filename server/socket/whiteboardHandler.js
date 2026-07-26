export const registerWhiteboardHandlers = (io, socket) => {
    // Join whiteboard room
    socket.on("whiteboard:join", (whiteboardId) => {
        if (whiteboardId) {
            socket.join(`whiteboard:${whiteboardId}`);
            console.log(`[WHITEBOARD JOIN] User ${socket.user.name} joined room: whiteboard:${whiteboardId}`);
        }
    });

    // Leave whiteboard room
    socket.on("whiteboard:leave", (whiteboardId) => {
        if (whiteboardId) {
            socket.leave(`whiteboard:${whiteboardId}`);
            console.log(`[WHITEBOARD LEAVE] User ${socket.user.name} left room: whiteboard:${whiteboardId}`);
        }
    });

    // Sync elements/drawings/updates
    socket.on("whiteboard:update", ({ whiteboardId, pages, currentPageId }) => {
        if (whiteboardId) {
            socket.to(`whiteboard:${whiteboardId}`).emit("whiteboard:updated", {
                pages,
                currentPageId
            });
        }
    });

    // Sync cursor positions
    socket.on("whiteboard:cursor", ({ whiteboardId, x, y }) => {
        if (whiteboardId) {
            socket.to(`whiteboard:${whiteboardId}`).emit("whiteboard:cursor_moved", {
                userId: socket.user.id,
                userName: socket.user.name,
                userImage: socket.user.image || "",
                x,
                y
            });
        }
    });
};
