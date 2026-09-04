import { prisma } from '../../config/prisma.js';
import { eventBus } from '../../services/eventBus.js';
import { getUserWorkspaceRole } from '../role/checkPermissionHelper.js';

// Update/Save whiteboard elements and viewport
export const saveWhiteboard = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, name, pages, currentPageId } = req.body;

        const updateData = {};
        if (data !== undefined) updateData.data = data;
        if (name !== undefined) updateData.name = name.trim();
        if (pages !== undefined) updateData.pages = pages;
        if (currentPageId !== undefined) updateData.currentPageId = currentPageId;

        const board = await prisma.whiteboard.findUnique({ where: { id } });
        if (!board) return res.status(404).json({ message: 'Whiteboard not found' });

        const { role } = await getUserWorkspaceRole(req.user.id, board.workspaceId);
        if (!role) {
            return res.status(403).json({ message: 'Access denied: not a member of this workspace' });
        }
        if (board.isPrivate && board.creatorId !== req.user.id) {
            const shared = typeof board.sharedEmails === 'string' ? JSON.parse(board.sharedEmails) : (board.sharedEmails || []);
            if (!(Array.isArray(shared) && shared.includes(req.user.email))) {
                return res.status(403).json({ message: 'Access denied to this private whiteboard' });
            }
        }

        const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;
        if (expectedVersion !== undefined && board.version !== expectedVersion) {
            return res.status(409).json({ message: "Conflict: Whiteboard was modified by another collaborator. Please reload." });
        }
        updateData.version = { increment: 1 };

        const previousState = { ...board };

        const whiteboard = await prisma.whiteboard.update({
            where: { id },
            data: updateData
        });

        await eventBus.publish('app/whiteboard.updated', {
            whiteboard,
            previousState,
            workspaceId: board.workspaceId,
            auditContext: {
                workspaceId: board.workspaceId,
                userId: req.user.id,
                ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                userAgent: req.headers["user-agent"]
            }
        });

        return res.status(200).json(whiteboard);
    } catch (err) {
        console.error("[SAVE WHITEBOARD ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};

// Share whiteboard with email list (only creator can share)
export const shareWhiteboard = async (req, res) => {
    try {
        const { id } = req.params;
        const { emails } = req.body;
        if (!Array.isArray(emails)) {
            return res.status(400).json({ message: 'emails must be an array of strings' });
        }
        const board = await prisma.whiteboard.findUnique({ where: { id } });
        if (!board) {
            return res.status(404).json({ message: 'Whiteboard not found' });
        }
        if (board.creatorId && board.creatorId !== req.user.id) {
            return res.status(403).json({ message: 'Only the creator can share this whiteboard' });
        }
        const previousState = { ...board };
        const updated = await prisma.whiteboard.update({
            where: { id },
            data: { sharedEmails: emails }
        });

        await eventBus.publish('app/whiteboard.updated', {
            whiteboard: updated,
            previousState,
            workspaceId: board.workspaceId,
            auditContext: {
                workspaceId: board.workspaceId,
                userId: req.user.id,
                ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                userAgent: req.headers["user-agent"]
            }
        });

        return res.status(200).json(updated);
    } catch (err) {
        console.error("[SHARE WHITEBOARD ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};
