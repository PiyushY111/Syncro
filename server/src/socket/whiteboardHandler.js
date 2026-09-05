import { prisma } from "../config/prisma.js";

const lastCursorEmits = new Map();

export const registerWhiteboardHandlers = (io, socket) => {
    // Join whiteboard room with authorization check
    socket.on("whiteboard:join", async (whiteboardId) => {
        if (!whiteboardId) return;
        try {
            const whiteboard = await prisma.whiteboard.findUnique({
                where: { id: whiteboardId },
                include: {
                    workspace: { select: { ownerId: true, members: { select: { userId: true } } } },
                    project: { select: { team_lead: true, workspaceId: true, members: { select: { userId: true } } } }
                }
            });

            if (!whiteboard) {
                return socket.emit("whiteboard:error", { message: "Whiteboard not found" });
            }

            const ws = whiteboard.workspace;
            const proj = whiteboard.project;

            const isWsMember = ws && (ws.ownerId === socket.user.id || ws.members?.some(m => m.userId === socket.user.id));
            const isProjMember = proj && (proj.team_lead === socket.user.id || proj.members?.some(m => m.userId === socket.user.id));
            const isCreator = whiteboard.creatorId === socket.user.id;

            if (!isWsMember && !isProjMember && !isCreator) {
                return socket.emit("whiteboard:error", { message: "Access denied to whiteboard" });
            }

            socket.join(`whiteboard:${whiteboardId}`);
        } catch (err) {
            console.error("[WHITEBOARD JOIN ERROR]", err.message);
        }
    });

    // Leave whiteboard room
    socket.on("whiteboard:leave", (whiteboardId) => {
        if (whiteboardId) {
            socket.leave(`whiteboard:${whiteboardId}`);
        }
    });

    // Sync elements/drawings/updates
    socket.on("whiteboard:update", ({ whiteboardId, pages, currentPageId }) => {
        if (whiteboardId && socket.rooms.has(`whiteboard:${whiteboardId}`)) {
            socket.to(`whiteboard:${whiteboardId}`).emit("whiteboard:updated", {
                pages,
                currentPageId
            });
        }
    });

    // Sync cursor positions with 30fps (~33ms cap) rate throttling per socket connection
    socket.on("whiteboard:cursor", ({ whiteboardId, x, y }) => {
        if (whiteboardId && socket.rooms.has(`whiteboard:${whiteboardId}`)) {
            const now = Date.now();
            const lastEmit = lastCursorEmits.get(socket.id) || 0;
            if (now - lastEmit < 33) return;
            lastCursorEmits.set(socket.id, now);

            socket.to(`whiteboard:${whiteboardId}`).emit("whiteboard:cursor_moved", {
                userId: socket.user.id,
                userName: socket.user.name,
                userImage: socket.user.image || "",
                x,
                y
            });
        }
    });

    socket.on("disconnect", () => {
        lastCursorEmits.delete(socket.id);
    });
};
