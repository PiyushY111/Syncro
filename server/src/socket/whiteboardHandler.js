import { prisma } from "../config/prisma.js";
import { hasWorkspacePermission } from "../controllers/role/checkPermissionHelper.js";
import logger from "../utils/logger/logger.js";

const lastCursorEmits = new Map();
// Cache of whether a given socket may broadcast whiteboard:update, computed
// once at join time (same trust-the-room-membership model this file already
// uses) rather than re-checked on every high-frequency update event.
const editPermissionBySocketWhiteboard = new Map();

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

            // A VIEWER-role workspace member can join (read) but must not be
            // able to broadcast edits — same manageWhiteboards permission the
            // REST save endpoint enforces (see whiteboardSave.js).
            const canManage = whiteboard.workspaceId
                ? await hasWorkspacePermission(socket.user.id, whiteboard.workspaceId, 'manageWhiteboards')
                : false;
            editPermissionBySocketWhiteboard.set(`${socket.id}:${whiteboardId}`, isCreator || canManage);

            socket.join(`whiteboard:${whiteboardId}`);
        } catch (err) {
            logger.error("[WHITEBOARD JOIN ERROR]", { error: err.message });
        }
    });

    // Leave whiteboard room
    socket.on("whiteboard:leave", (whiteboardId) => {
        if (whiteboardId) {
            socket.leave(`whiteboard:${whiteboardId}`);
            editPermissionBySocketWhiteboard.delete(`${socket.id}:${whiteboardId}`);
        }
    });

    // Sync elements/drawings/updates. Last-write-wins: whichever update
    // reaches other clients last overwrites their local state — there is no
    // CRDT/OT merge, so concurrent edits to the same page can silently drop
    // each other's changes (see README/ARCHITECTURE for this documented).
    socket.on("whiteboard:update", ({ whiteboardId, pages, currentPageId }) => {
        if (whiteboardId && socket.rooms.has(`whiteboard:${whiteboardId}`)) {
            if (!editPermissionBySocketWhiteboard.get(`${socket.id}:${whiteboardId}`)) {
                return socket.emit("whiteboard:error", { message: "You do not have permission to edit this whiteboard" });
            }
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
        for (const key of editPermissionBySocketWhiteboard.keys()) {
            if (key.startsWith(`${socket.id}:`)) {
                editPermissionBySocketWhiteboard.delete(key);
            }
        }
    });
};
