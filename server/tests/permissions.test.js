import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserWorkspaceRole, hasWorkspacePermission } from '../controllers/role/checkPermissionHelper.js';
import { prisma } from '../config/prisma.js';

vi.mock('../config/prisma.js', () => ({
    prisma: {
        workspaceMember: { findUnique: vi.fn() },
        workspace: { findUnique: vi.fn() }
    }
}));

vi.mock('../config/redis.js', () => ({
    redisCache: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue("OK")
    }
}));

describe('Permission and Roles Helper', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUserWorkspaceRole', () => {
        it('should return OWNER role if user is the workspace owner', async () => {
            prisma.workspaceMember.findUnique.mockResolvedValue({
                workspace: { id: 'w1', ownerId: 'u1' },
                role: 'ADMIN',
                customRole: ''
            });

            const res = await getUserWorkspaceRole('u1', 'w1');
            expect(res.role).toBe('OWNER');
            expect(res.isOwner).toBe(true);
        });

        it('should return member active role if they are not the owner', async () => {
            prisma.workspaceMember.findUnique.mockResolvedValue({
                workspace: { id: 'w1', ownerId: 'owner-id' },
                role: 'MANAGER',
                customRole: ''
            });

            const res = await getUserWorkspaceRole('u1', 'w1');
            expect(res.role).toBe('MANAGER');
            expect(res.isOwner).toBe(false);
        });
    });

    describe('hasWorkspacePermission', () => {
        it('should return true for any permission for OWNER', async () => {
            prisma.workspaceMember.findUnique.mockResolvedValue({
                workspace: { id: 'w1', ownerId: 'u1' }
            });
            const permitted = await hasWorkspacePermission('u1', 'w1', 'deleteProject');
            expect(permitted).toBe(true);
        });

        it('should block MEMBER from deleteProject permission', async () => {
            prisma.workspaceMember.findUnique.mockResolvedValue({
                workspace: { id: 'w1', ownerId: 'owner-id', settings: {} },
                role: 'MEMBER'
            });
            const permitted = await hasWorkspacePermission('u1', 'w1', 'deleteProject');
            expect(permitted).toBe(false);
        });
    });
});
