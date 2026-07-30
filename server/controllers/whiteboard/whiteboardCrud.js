import { prisma } from '../../config/prisma.js';
import { hasWorkspacePermission, getUserWorkspaceRole } from '../role/checkPermissionHelper.js';
import { eventBus } from '../../services/eventBus.js';

// Get all whiteboards for a project
export const getProjectWhiteboards = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        const { role } = await getUserWorkspaceRole(req.user.id, project.workspaceId);
        if (!role) {
            return res.status(403).json({ message: "Access restricted to workspace members only" });
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
    } catch (err) {
        console.error("[GET PROJECT WHITEBOARDS ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};

// Get all whiteboards for a workspace
export const getWorkspaceWhiteboards = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user.id;
        const userEmail = req.user.email;

        const { role } = await getUserWorkspaceRole(userId, workspaceId);
        if (!role) {
            return res.status(403).json({ message: "Access restricted to workspace members only" });
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
    } catch (err) {
        console.error("[GET WORKSPACE WHITEBOARDS ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};

// Get a single whiteboard by ID
export const getWhiteboard = async (req, res) => {
    try {
        const { id } = req.params;
        const whiteboard = await prisma.whiteboard.findUnique({
            where: { id }
        });
        if (!whiteboard) {
            return res.status(404).json({ message: 'Whiteboard not found' });
        }
        if (whiteboard.isPrivate) {
            const shared = typeof whiteboard.sharedEmails === 'string' ? JSON.parse(whiteboard.sharedEmails) : (whiteboard.sharedEmails || []);
            if (whiteboard.creatorId !== req.user.id && !(Array.isArray(shared) && shared.includes(req.user.email))) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }
        return res.status(200).json(whiteboard);
    } catch (err) {
        console.error("[GET WHITEBOARD ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};

// Create a new whiteboard
export const createWhiteboard = async (req, res) => {
    try {
        const { projectId, workspaceId, name, isPrivate = false } = req.body;
        if (!workspaceId) {
            return res.status(400).json({ message: 'workspaceId is required' });
        }
        const canManage = await hasWorkspacePermission(req.user.id, workspaceId, 'manageWhiteboards');
        if (!canManage) {
            return res.status(403).json({ message: "You do not have permission to create whiteboards in this workspace" });
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
    } catch (err) {
        console.error("[CREATE WHITEBOARD ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};

// Delete a whiteboard
export const deleteWhiteboard = async (req, res) => {
    try {
        const { id } = req.params;
        const board = await prisma.whiteboard.findUnique({ where: { id } });
        if (!board) return res.status(404).json({ message: 'Whiteboard not found' });
        const isCreator = board.creatorId === req.user.id;
        const canManage = await hasWorkspacePermission(req.user.id, board.workspaceId, 'manageWhiteboards');
        if (!isCreator && !canManage) {
            return res.status(403).json({ message: 'You do not have permission to delete this whiteboard' });
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
    } catch (err) {
        console.error("[DELETE WHITEBOARD ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};

// Toggle star status on a whiteboard
export const starWhiteboard = async (req, res) => {
    try {
        const { id } = req.params;
        const board = await prisma.whiteboard.findUnique({ where: { id } });
        if (!board) return res.status(404).json({ message: 'Whiteboard not found' });
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
    } catch (err) {
        console.error("[STAR WHITEBOARD ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};
