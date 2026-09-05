import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createSubTeam,
    getWorkspaceSubTeams,
    updateSubTeam,
    deleteSubTeam,
    addSubTeamMember,
    removeSubTeamMember
} from '../controllers/subTeamController.js';
import { prisma } from '../config/prisma.js';
import { hasWorkspacePermission } from '../controllers/role/checkPermissionHelper.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors/appError.js';

vi.mock('../config/prisma.js', () => ({
    prisma: {
        workspace: { findUnique: vi.fn() },
        subTeam: {
            create: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        },
        subTeamMember: {
            create: vi.fn(),
            deleteMany: vi.fn()
        },
        project: { findUnique: vi.fn() },
        user: { findUnique: vi.fn() }
    }
}));

vi.mock('../controllers/role/checkPermissionHelper.js', () => ({
    hasWorkspacePermission: vi.fn()
}));

vi.mock('../services/eventBus.js', () => ({
    eventBus: { publish: vi.fn().mockResolvedValue(true) }
}));

describe('SubTeam Controller Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();
        req = {
            user: { id: 'admin-user-id' },
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

    describe('createSubTeam', () => {
        it('throws BadRequestError if name is missing', async () => {
            req.body = { workspaceId: 'ws-1' };
            await expect(createSubTeam(req, res)).rejects.toThrow(BadRequestError);
        });

        it('throws BadRequestError if workspaceId is missing', async () => {
            req.body = { name: 'Frontend Guild' };
            await expect(createSubTeam(req, res)).rejects.toThrow(BadRequestError);
        });

        it('throws NotFoundError if workspace does not exist', async () => {
            req.body = { name: 'Frontend Guild', workspaceId: 'ws-missing' };
            prisma.workspace.findUnique.mockResolvedValueOnce(null);

            await expect(createSubTeam(req, res)).rejects.toThrow(NotFoundError);
        });

        it('throws ForbiddenError if user lacks manageSubTeams permission', async () => {
            req.body = { name: 'Frontend Guild', workspaceId: 'ws-1' };
            prisma.workspace.findUnique.mockResolvedValueOnce({ id: 'ws-1', members: [] });
            hasWorkspacePermission.mockResolvedValueOnce(false);

            await expect(createSubTeam(req, res)).rejects.toThrow(ForbiddenError);
        });

        it('creates sub-team and returns 201 on success', async () => {
            req.body = { name: 'Frontend Guild', description: 'Web team', workspaceId: 'ws-1' };
            prisma.workspace.findUnique.mockResolvedValueOnce({ id: 'ws-1', members: [] });
            hasWorkspacePermission.mockResolvedValueOnce(true);

            const createdSubTeam = {
                id: 'st-1',
                name: 'Frontend Guild',
                description: 'Web team',
                workspaceId: 'ws-1',
                members: [],
                project: null
            };
            prisma.subTeam.create.mockResolvedValueOnce(createdSubTeam);

            await createSubTeam(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Sub-team created successfully',
                data: { subTeam: createdSubTeam }
            }));
        });
    });

    describe('getWorkspaceSubTeams', () => {
        it('throws NotFoundError if workspace not found', async () => {
            req.params = { workspaceId: 'ws-missing' };
            prisma.workspace.findUnique.mockResolvedValueOnce(null);

            await expect(getWorkspaceSubTeams(req, res)).rejects.toThrow(NotFoundError);
        });

        it('throws ForbiddenError if caller is not a member of the workspace', async () => {
            req.params = { workspaceId: 'ws-1' };
            prisma.workspace.findUnique.mockResolvedValueOnce({
                id: 'ws-1',
                ownerId: 'other-owner',
                members: [{ userId: 'other-member' }]
            });

            await expect(getWorkspaceSubTeams(req, res)).rejects.toThrow(ForbiddenError);
        });

        it('returns list of sub-teams when caller is authorized', async () => {
            req.params = { workspaceId: 'ws-1' };
            prisma.workspace.findUnique.mockResolvedValueOnce({
                id: 'ws-1',
                ownerId: 'admin-user-id',
                members: []
            });

            const subTeamsList = [{ id: 'st-1', name: 'Design Squad', members: [], project: null }];
            prisma.subTeam.findMany.mockResolvedValueOnce(subTeamsList);

            await getWorkspaceSubTeams(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: { subTeams: subTeamsList }
            }));
        });
    });

    describe('updateSubTeam', () => {
        it('throws NotFoundError if sub-team does not exist', async () => {
            req.params = { id: 'st-missing' };
            prisma.subTeam.findUnique.mockResolvedValueOnce(null);

            await expect(updateSubTeam(req, res)).rejects.toThrow(NotFoundError);
        });

        it('throws BadRequestError if assigned project belongs to different workspace', async () => {
            req.params = { id: 'st-1' };
            req.body = { projectId: 'proj-other-ws' };
            prisma.subTeam.findUnique.mockResolvedValueOnce({ id: 'st-1', workspaceId: 'ws-1', workspace: { members: [] } });
            hasWorkspacePermission.mockResolvedValueOnce(true);
            prisma.project.findUnique.mockResolvedValueOnce({ id: 'proj-other-ws', workspaceId: 'ws-different' });

            await expect(updateSubTeam(req, res)).rejects.toThrow(BadRequestError);
        });

        it('updates subteam and returns updated payload', async () => {
            req.params = { id: 'st-1' };
            req.body = { name: 'Updated Name', description: 'New desc' };
            const existingSubTeam = { id: 'st-1', name: 'Old Name', workspaceId: 'ws-1', workspace: { members: [] } };
            prisma.subTeam.findUnique
                .mockResolvedValueOnce(existingSubTeam)
                .mockResolvedValueOnce(existingSubTeam);
            hasWorkspacePermission.mockResolvedValueOnce(true);

            const updatedSubTeam = { ...existingSubTeam, name: 'Updated Name', description: 'New desc' };
            prisma.subTeam.update.mockResolvedValueOnce(updatedSubTeam);

            await updateSubTeam(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Sub-team updated successfully',
                data: { subTeam: updatedSubTeam }
            }));
        });
    });

    describe('deleteSubTeam', () => {
        it('deletes subteam successfully when authorized', async () => {
            req.params = { id: 'st-1' };
            const existingSubTeam = { id: 'st-1', name: 'To Delete', workspaceId: 'ws-1', workspace: { members: [] } };
            prisma.subTeam.findUnique
                .mockResolvedValueOnce(existingSubTeam)
                .mockResolvedValueOnce(existingSubTeam);
            hasWorkspacePermission.mockResolvedValueOnce(true);
            prisma.subTeam.delete.mockResolvedValueOnce(existingSubTeam);

            await deleteSubTeam(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Sub-team deleted successfully'
            }));
        });
    });

    describe('addSubTeamMember', () => {
        it('throws BadRequestError if target user is not in workspace', async () => {
            req.params = { id: 'st-1' };
            req.body = { userId: 'outsider-user' };
            prisma.subTeam.findUnique.mockResolvedValueOnce({
                id: 'st-1',
                workspaceId: 'ws-1',
                workspace: { ownerId: 'admin-user-id', members: [{ userId: 'member-1' }] }
            });
            hasWorkspacePermission.mockResolvedValueOnce(true);

            await expect(addSubTeamMember(req, res)).rejects.toThrow(BadRequestError);
        });

        it('handles unique constraint conflict when adding existing member', async () => {
            req.params = { id: 'st-1' };
            req.body = { userId: 'member-1' };
            prisma.subTeam.findUnique.mockResolvedValueOnce({
                id: 'st-1',
                workspaceId: 'ws-1',
                workspace: { ownerId: 'admin-user-id', members: [{ userId: 'member-1' }] }
            });
            hasWorkspacePermission.mockResolvedValueOnce(true);

            const p2002Err = new Error('Unique constraint failed');
            p2002Err.code = 'P2002';
            prisma.subTeamMember.create.mockRejectedValueOnce(p2002Err);

            await expect(addSubTeamMember(req, res)).rejects.toThrow(ConflictError);
        });
    });

    describe('removeSubTeamMember', () => {
        it('removes member from subteam successfully', async () => {
            req.params = { id: 'st-1', userId: 'member-1' };
            prisma.subTeam.findUnique.mockResolvedValueOnce({
                id: 'st-1',
                workspaceId: 'ws-1',
                workspace: { ownerId: 'admin-user-id', members: [] }
            });
            hasWorkspacePermission.mockResolvedValueOnce(true);
            prisma.user.findUnique.mockResolvedValueOnce({ name: 'Bob' });
            prisma.subTeamMember.deleteMany.mockResolvedValueOnce({ count: 1 });

            await removeSubTeamMember(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Member removed from sub-team successfully'
            }));
        });
    });
});
