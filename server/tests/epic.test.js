import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEpic } from '../controllers/epic/createEpic.js';
import { getProjectEpics } from '../controllers/epic/getProjectEpics.js';
import { updateEpic, deleteEpic } from '../controllers/epic/epicManage.js';
import { prisma } from '../config/prisma.js';
import { hasWorkspacePermission } from '../controllers/role/checkPermissionHelper.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors/appError.js';

vi.mock('../config/prisma.js', () => ({
    prisma: {
        project: { findUnique: vi.fn() },
        epic: {
            create: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        }
    }
}));

vi.mock('../controllers/role/checkPermissionHelper.js', () => ({
    hasWorkspacePermission: vi.fn()
}));

vi.mock('../services/eventBus.js', () => ({
    eventBus: { publish: vi.fn().mockResolvedValue(true) }
}));

describe('Epic Controller Unit Tests', () => {
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

    describe('createEpic', () => {
        it('throws BadRequestError when epic name is missing', async () => {
            req.params = { projectId: 'proj-1' };
            req.body = { name: '   ' };

            await expect(createEpic(req, res)).rejects.toThrow(BadRequestError);
        });

        it('throws NotFoundError if project does not exist', async () => {
            req.params = { projectId: 'proj-missing' };
            req.body = { name: 'Authentication Overhaul' };
            prisma.project.findUnique.mockResolvedValueOnce(null);

            await expect(createEpic(req, res)).rejects.toThrow(NotFoundError);
        });

        it('throws ForbiddenError if user lacks editTasks permission', async () => {
            req.params = { projectId: 'proj-1' };
            req.body = { name: 'Auth Overhaul' };
            prisma.project.findUnique.mockResolvedValueOnce({ id: 'proj-1', workspaceId: 'ws-1' });
            hasWorkspacePermission.mockResolvedValueOnce(false);

            await expect(createEpic(req, res)).rejects.toThrow(ForbiddenError);
        });

        it('creates epic and returns 201 when permitted', async () => {
            req.params = { projectId: 'proj-1' };
            req.body = { name: 'Auth Overhaul', description: '2FA and Passkeys', color: '#3B82F6' };
            prisma.project.findUnique.mockResolvedValueOnce({ id: 'proj-1', workspaceId: 'ws-1' });
            hasWorkspacePermission.mockResolvedValueOnce(true);

            const createdEpic = {
                id: 'epic-1',
                name: 'Auth Overhaul',
                description: '2FA and Passkeys',
                color: '#3B82F6',
                projectId: 'proj-1'
            };
            prisma.epic.create.mockResolvedValueOnce(createdEpic);

            await createEpic(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Epic created successfully',
                data: { epic: createdEpic }
            }));
        });
    });

    describe('getProjectEpics', () => {
        it('calculates progress percentage correctly from tasks', async () => {
            req.params = { projectId: 'proj-1' };
            const epicsList = [
                {
                    id: 'epic-1',
                    name: 'Shield Gateway',
                    tasks: [
                        { id: 't1', status: 'DONE' },
                        { id: 't2', status: 'IN_PROGRESS' },
                        { id: 't3', status: 'DONE' },
                        { id: 't4', status: 'TODO' }
                    ]
                },
                {
                    id: 'epic-2',
                    name: 'Empty Epic',
                    tasks: []
                }
            ];
            prisma.epic.findMany.mockResolvedValueOnce(epicsList);

            await getProjectEpics(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: {
                    epics: [
                        expect.objectContaining({
                            id: 'epic-1',
                            progress: 50,
                            totalTasks: 4,
                            completedTasks: 2
                        }),
                        expect.objectContaining({
                            id: 'epic-2',
                            progress: 0,
                            totalTasks: 0,
                            completedTasks: 0
                        })
                    ]
                }
            }));
        });
    });

    describe('updateEpic', () => {
        it('throws NotFoundError if epic does not exist', async () => {
            req.params = { epicId: 'epic-missing' };
            prisma.epic.findUnique.mockResolvedValueOnce(null);

            await expect(updateEpic(req, res)).rejects.toThrow(NotFoundError);
        });

        it('updates epic and returns 200 on success', async () => {
            req.params = { epicId: 'epic-1' };
            req.body = { name: 'Renamed Epic', color: '#10B981' };
            const existingEpic = {
                id: 'epic-1',
                name: 'Old Epic',
                project: { workspaceId: 'ws-1' }
            };
            prisma.epic.findUnique.mockResolvedValueOnce(existingEpic);
            hasWorkspacePermission.mockResolvedValueOnce(true);

            const updatedEpic = { ...existingEpic, name: 'Renamed Epic', color: '#10B981' };
            prisma.epic.update.mockResolvedValueOnce(updatedEpic);

            await updateEpic(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Epic updated successfully',
                data: { epic: updatedEpic }
            }));
        });
    });

    describe('deleteEpic', () => {
        it('deletes epic and emits deletion event on success', async () => {
            req.params = { epicId: 'epic-1' };
            const existingEpic = {
                id: 'epic-1',
                name: 'To Delete',
                project: { workspaceId: 'ws-1' }
            };
            prisma.epic.findUnique.mockResolvedValueOnce(existingEpic);
            hasWorkspacePermission.mockResolvedValueOnce(true);
            prisma.epic.delete.mockResolvedValueOnce(existingEpic);

            await deleteEpic(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Epic deleted successfully'
            }));
        });
    });
});
