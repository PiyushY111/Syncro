import { prisma } from '../../config/prisma.js';
import { eventBus } from '../../services/eventBus.js';
import { getUserWorkspaceRole, hasWorkspacePermission } from '../role/checkPermissionHelper.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../../utils/errors/appError.js';

// Update/Save whiteboard elements and viewport
export const saveWhiteboard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { data, name, pages, currentPageId } = req.body;

    const updateData = {};
    if (data !== undefined) updateData.data = data;
    if (name !== undefined) updateData.name = name.trim();
    if (pages !== undefined) updateData.pages = pages;
    if (currentPageId !== undefined) updateData.currentPageId = currentPageId;

    const board = await prisma.whiteboard.findUnique({ where: { id } });
    if (!board) throw new NotFoundError('Whiteboard not found');

    const { role } = await getUserWorkspaceRole(req.user.id, board.workspaceId);
    if (!role) {
        throw new ForbiddenError('Access denied: not a member of this workspace');
    }

    // A workspace member alone isn't enough to edit — a VIEWER-role member
    // (manageWhiteboards: false in defaultPermissions) can currently save
    // over anyone's whiteboard content, same gap as the socket broadcast
    // path in src/socket/whiteboardHandler.js.
    const isCreator = board.creatorId === req.user.id;
    const canManage = board.workspaceId
        ? await hasWorkspacePermission(req.user.id, board.workspaceId, 'manageWhiteboards')
        : false;
    if (!isCreator && !canManage) {
        throw new ForbiddenError('You do not have permission to edit this whiteboard');
    }

    if (board.isPrivate && board.creatorId !== req.user.id) {
        const shared = typeof board.sharedEmails === 'string' ? JSON.parse(board.sharedEmails) : (board.sharedEmails || []);
        if (!(Array.isArray(shared) && shared.includes(req.user.email))) {
            throw new ForbiddenError('Access denied to this private whiteboard');
        }
    }

    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;
    if (expectedVersion !== undefined && board.version !== expectedVersion) {
        throw new ConflictError("Conflict: Whiteboard was modified by another collaborator. Please reload.");
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
});

// Share whiteboard with email list (only creator can share)
export const shareWhiteboard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { emails } = req.body;
    if (!Array.isArray(emails)) {
        throw new BadRequestError('emails must be an array of strings');
    }
    const board = await prisma.whiteboard.findUnique({ where: { id } });
    if (!board) {
        throw new NotFoundError('Whiteboard not found');
    }
    if (board.creatorId && board.creatorId !== req.user.id) {
        throw new ForbiddenError('Only the creator can share this whiteboard');
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
});
