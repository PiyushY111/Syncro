import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWorkspace, getUserWorkspaces } from '../controllers/workspace/workspaceCreate.js';
import { prisma } from '../config/prisma.js';
import { redisCache } from '../config/redis.js';

vi.mock('../config/prisma.js', () => {
    const mockPrisma = {
        $transaction: vi.fn(async (cb) => cb(mockPrisma)),
        workspace: { create: vi.fn() },
        workspaceMember: { findMany: vi.fn() },
        platformSetting: { findUnique: vi.fn().mockResolvedValue(null) },
        subTeam: { findMany: vi.fn().mockResolvedValue([]) }
    };
    return { prisma: mockPrisma };
});

vi.mock('../config/redis.js', () => ({
    redisCache: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue("OK"),
        setNx: vi.fn().mockResolvedValue(true),
        del: vi.fn().mockResolvedValue(1)
    }
}));

vi.mock('../services/eventBus.js', () => ({
    eventBus: { publish: vi.fn().mockResolvedValue(true) }
}));

describe('Workspace Caching & CRUD', () => {
    let req, res;
    beforeEach(() => {
        req = { user: { id: 'u1' }, body: {}, headers: {}, socket: {} };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
        vi.clearAllMocks();
    });

    it('should return workspaces from cache if available', async () => {
        redisCache.get.mockResolvedValueOnce(JSON.stringify({ workspaces: [{ id: 'w1', name: 'Cached WS' }] }));

        await getUserWorkspaces(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: { workspaces: [{ id: 'w1', name: 'Cached WS' }] }
        }));
        expect(prisma.workspaceMember.findMany).not.toHaveBeenCalled();
    });

    it('should query DB and populate cache if not cached', async () => {
        prisma.workspaceMember.findMany.mockResolvedValue([
            { workspace: { id: 'w1', name: 'DB WS', ownerId: 'u1', approvalStatus: 'APPROVED', projects: [] }, role: 'OWNER' }
        ]);

        await getUserWorkspaces(req, res);
        expect(prisma.workspaceMember.findMany).toHaveBeenCalled();
        expect(redisCache.set).toHaveBeenCalledWith(
            'user:workspaces:u1',
            expect.stringContaining('DB WS'),
            60
        );
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: { workspaces: [expect.objectContaining({ id: 'w1', name: 'DB WS' })] }
        }));
    });

    it('should clear workspace cache when a new workspace is created', async () => {
        req.body = { name: 'New Workspace' };
        prisma.workspace.create.mockResolvedValue({ id: 'w2', name: 'New Workspace', ownerId: 'u1' });

        await createWorkspace(req, res);
        expect(redisCache.del).toHaveBeenCalledWith('user:workspaces:u1');
        expect(res.status).toHaveBeenCalledWith(201);
    });
});
