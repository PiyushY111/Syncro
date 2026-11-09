import { describe, it, expect } from 'vitest';
import { getNavAccess, buildNavGroups } from './sidebarNav';

const names = (groups) => groups.flatMap((g) => g.items.map((i) => i.name));

describe('getNavAccess', () => {
    it('grants owners everything except super-admin', () => {
        const access = getNavAccess({ ownerId: 'u1', members: [] }, { id: 'u1' });
        expect(access).toEqual({ isOwner: true, isSuperAdmin: false, canAccessRolePortal: true, canAccessAuditLogs: true });
    });

    it('lets managers into the role portal only when the workspace allows it', () => {
        const workspace = { ownerId: 'x', members: [{ userId: 'u1', role: 'MANAGER' }] };
        expect(getNavAccess(workspace, { id: 'u1' }).canAccessRolePortal).toBe(false);
        expect(getNavAccess({ ...workspace, settings: { allowManagerPortalAccess: true } }, { id: 'u1' }).canAccessRolePortal).toBe(true);
        expect(getNavAccess(workspace, { id: 'u1' }).canAccessAuditLogs).toBe(true);
    });

    it('gives plain members no governance access', () => {
        const access = getNavAccess({ ownerId: 'x', members: [{ userId: 'u1', role: 'MEMBER' }] }, { id: 'u1' });
        expect(access.canAccessRolePortal || access.canAccessAuditLogs || access.isOwner).toBe(false);
    });
});

describe('buildNavGroups', () => {
    it('drops the governance group when nothing in it is allowed', () => {
        const groups = buildNavGroups({ isOwner: false, isSuperAdmin: false, canAccessRolePortal: false, canAccessAuditLogs: false });
        expect(groups.map((g) => g.label)).toEqual(['Work', 'Team']);
    });

    it('includes only the governance items the user may access', () => {
        const groups = buildNavGroups({ isOwner: true, isSuperAdmin: false, canAccessRolePortal: true, canAccessAuditLogs: true });
        expect(names(groups)).toContain('Owner Command');
        expect(names(groups)).not.toContain('Gatekeeper');
    });
});
