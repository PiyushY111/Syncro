import { prisma } from '../../config/prisma.js';
import { hasWorkspacePermission, getUserWorkspaceRole } from '../role/checkPermissionHelper.js';
import { eventBus } from '../../services/eventBus.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors/appError.js';

// Get all whiteboards for a project
export const getProjectWhiteboards = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });
    if (!project) {
        throw new NotFoundError("Project not found");
    }
    const { role } = await getUserWorkspaceRole(req.user.id, project.workspaceId);
    if (!role) {
        throw new ForbiddenError("Access restricted to workspace members only");
    }

    const whiteboards = await prisma.whiteboard.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
    });

    const filtered = whiteboards.filter(w => {
        if (!w.isPrivate) return true;
        if (w.creatorId === req.user.id) return true;
        const shared = typeof w.sharedEmails === 'string' ? JSON.parse(w.sharedEmails) : (w.sharedEmails || []);
        return Array.isArray(shared) && shared.includes(req.user.email);
    });

    return res.status(200).json(filtered);
});

// Get all whiteboards for a workspace
export const getWorkspaceWhiteboards = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const userEmail = req.user.email;

    const { role } = await getUserWorkspaceRole(userId, workspaceId);
    if (!role) {
        throw new ForbiddenError("Access restricted to workspace members only");
    }

    const whiteboards = await prisma.whiteboard.findMany({
        where: { workspaceId },
        include: { project: true },
        orderBy: [
            { isStarred: 'desc' },
            { createdAt: 'desc' }
        ]
    });

    const filtered = whiteboards.filter(w => {
        if (!w.isPrivate) return true;
        if (w.creatorId === userId) return true;
        const shared = typeof w.sharedEmails === 'string' ? JSON.parse(w.sharedEmails) : (w.sharedEmails || []);
        return Array.isArray(shared) && shared.includes(userEmail);
    });

    return res.status(200).json(filtered);
});

// Get a single whiteboard by ID
export const getWhiteboard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const whiteboard = await prisma.whiteboard.findUnique({
        where: { id }
    });
    if (!whiteboard) {
        throw new NotFoundError('Whiteboard not found');
    }
    if (whiteboard.isPrivate) {
        const shared = typeof whiteboard.sharedEmails === 'string' ? JSON.parse(whiteboard.sharedEmails) : (whiteboard.sharedEmails || []);
        if (whiteboard.creatorId !== req.user.id && !(Array.isArray(shared) && shared.includes(req.user.email))) {
            throw new ForbiddenError('Access denied');
        }
    }
    return res.status(200).json(whiteboard);
});

// Create a new whiteboard
export const createWhiteboard = asyncHandler(async (req, res) => {
    const { projectId, workspaceId, name, isPrivate = false } = req.body;
    if (!workspaceId) {
        throw new BadRequestError('workspaceId is required');
    }
    const canManage = await hasWorkspacePermission(req.user.id, workspaceId, 'manageWhiteboards');
    if (!canManage) {
        throw new ForbiddenError("You do not have permission to create whiteboards in this workspace");
    }
    const whiteboard = await prisma.whiteboard.create({
        data: {
            workspaceId,
            projectId: projectId || null,
            creatorId: req.user.id,
            isPrivate,
            name: name?.trim() || "Project Board",
            data: { nodes: [], edges: [], drawings: [], viewport: { x: 0, y: 0, zoom: 1 } }
        }
    });

    await eventBus.publish('app/whiteboard.created', {
        whiteboard,
        workspaceId,
        auditContext: {
            workspaceId,
            userId: req.user.id,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.status(201).json(whiteboard);
});

// Delete a whiteboard
export const deleteWhiteboard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const board = await prisma.whiteboard.findUnique({ where: { id } });
    if (!board) throw new NotFoundError('Whiteboard not found');
    const isCreator = board.creatorId === req.user.id;
    const canManage = await hasWorkspacePermission(req.user.id, board.workspaceId, 'manageWhiteboards');
    if (!isCreator && !canManage) {
        throw new ForbiddenError('You do not have permission to delete this whiteboard');
    }
    const previousState = { ...board };

    await prisma.whiteboard.delete({
        where: { id }
    });

    await eventBus.publish('app/whiteboard.deleted', {
        whiteboardId: id,
        whiteboardName: board.name,
        workspaceId: board.workspaceId,
        previousState,
        auditContext: {
            workspaceId: board.workspaceId,
            userId: req.user.id,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.status(200).json({ message: 'Whiteboard deleted successfully' });
});

// Toggle star status on a whiteboard
export const starWhiteboard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const board = await prisma.whiteboard.findUnique({ where: { id } });
    if (!board) throw new NotFoundError('Whiteboard not found');

    if (board.workspaceId) {
        const { role } = await getUserWorkspaceRole(req.user.id, board.workspaceId);
        if (!role) {
            throw new ForbiddenError("Access restricted to workspace members only");
        }
    }

    const updated = await prisma.whiteboard.update({
        where: { id },
        data: { isStarred: !board.isStarred }
    });

    await eventBus.publish('app/whiteboard.updated', {
        whiteboard: updated,
        previousState: board,
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
