import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canAccessTaskComments, addComment, getComments } from '../src/controllers/commentController.js';
import { prisma } from '../src/config/prisma.js';
import { getUserWorkspaceRole } from '../src/controllers/role/checkPermissionHelper.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../src/utils/errors/appError.js';

vi.mock('../src/config/prisma.js', () => ({
    prisma: {
        task: { findUnique: vi.fn() },
        project: { findUnique: vi.fn() },
        comment: {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn()
        }
    }
}));

vi.mock('../src/controllers/role/checkPermissionHelper.js', () => ({
    getUserWorkspaceRole: vi.fn()
}));

vi.mock('../src/services/eventBus.js', () => ({
    eventBus: { publish: vi.fn().mockResolvedValue(true) }
}));

describe('Comment Controller & Authorization Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();
        req = {
            user: { id: 'user-1' },
            body: {},
            params: {},
            headers: {},
            socket: {}
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
    });

    describe('canAccessTaskComments Authorization Predicate', () => {
        it('allows workspace owner to access comments', async () => {
            getUserWorkspaceRole.mockResolvedValueOnce({ role: 'ADMIN', isOwner: true });
            const allowed = await canAccessTaskComments('user-1', { assigneeId: 'other' }, { workspaceId: 'ws-1' });
            expect(allowed).toBe(true);
        });

        it('allows task assignee to access comments even if member', async () => {
            getUserWorkspaceRole.mockResolvedValueOnce({ role: 'MEMBER', isOwner: false });
            const allowed = await canAccessTaskComments('user-1', { assigneeId: 'user-1' }, { workspaceId: 'ws-1' });
            expect(allowed).toBe(true);
        });

        it('denies access if user has no role in the workspace and is not assigned', async () => {
            getUserWorkspaceRole.mockResolvedValueOnce({ role: null, isOwner: false });
            const allowed = await canAccessTaskComments('user-unknown', { assigneeId: 'other' }, { workspaceId: 'ws-1', members: [] });
            expect(allowed).toBe(false);
        });
    });

    describe('addComment', () => {
        it('throws BadRequestError if taskId is missing', async () => {
            req.body = { content: 'Nice work' };
            await expect(addComment(req, res)).rejects.toThrow(BadRequestError);
        });

        it('throws BadRequestError if content is empty', async () => {
            req.body = { taskId: 'task-1', content: '   ' };
            await expect(addComment(req, res)).rejects.toThrow(BadRequestError);
        });

        it('throws NotFoundError if task is not found', async () => {
            req.body = { taskId: 'task-nonexistent', content: 'Hello' };
            prisma.task.findUnique.mockResolvedValueOnce(null);

            await expect(addComment(req, res)).rejects.toThrow(NotFoundError);
        });

        it('throws ForbiddenError if user is not authorized', async () => {
            req.body = { taskId: 'task-1', content: 'Hello' };
            prisma.task.findUnique.mockResolvedValueOnce({ id: 'task-1', projectId: 'proj-1', assigneeId: 'user-2' });
            prisma.project.findUnique.mockResolvedValueOnce({ id: 'proj-1', workspaceId: 'ws-1', members: [] });
            getUserWorkspaceRole.mockResolvedValueOnce({ role: null, isOwner: false });

            await expect(addComment(req, res)).rejects.toThrow(ForbiddenError);
        });

        it('creates comment and returns 201 when authorized', async () => {
            req.body = { taskId: 'task-1', content: 'Great job!' };
            prisma.task.findUnique.mockResolvedValueOnce({ id: 'task-1', projectId: 'proj-1', assigneeId: 'user-1' });
            prisma.project.findUnique.mockResolvedValueOnce({ id: 'proj-1', workspaceId: 'ws-1', members: [] });
            getUserWorkspaceRole.mockResolvedValueOnce({ role: 'MEMBER', isOwner: false });

            const createdComment = { id: 'c-1', content: 'Great job!', taskId: 'task-1', userId: 'user-1' };
            const fullComment = { ...createdComment, user: { id: 'user-1', name: 'Alice' } };

            prisma.comment.create.mockResolvedValueOnce(createdComment);
            prisma.comment.findUnique.mockResolvedValueOnce(fullComment);

            await addComment(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Comment added successfully',
                data: { comment: fullComment }
            }));
        });
    });

    describe('getComments', () => {
        it('throws NotFoundError if task does not exist', async () => {
            req.params = { taskId: 'task-missing' };
            prisma.task.findUnique.mockResolvedValueOnce(null);

            await expect(getComments(req, res)).rejects.toThrow(NotFoundError);
        });

        it('fetches comments ordered by createdAt asc when authorized', async () => {
            req.params = { taskId: 'task-1' };
            prisma.task.findUnique.mockResolvedValueOnce({ id: 'task-1', projectId: 'proj-1', assigneeId: 'user-1' });
            prisma.project.findUnique.mockResolvedValueOnce({ id: 'proj-1', workspaceId: 'ws-1', members: [] });
            getUserWorkspaceRole.mockResolvedValueOnce({ role: 'ADMIN', isOwner: false });

            const commentsList = [
                { id: 'c-1', content: 'First', createdAt: new Date() },
                { id: 'c-2', content: 'Second', createdAt: new Date() }
            ];
            prisma.comment.findMany.mockResolvedValueOnce(commentsList);

            await getComments(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: { comments: commentsList }
            }));
        });
    });
});
