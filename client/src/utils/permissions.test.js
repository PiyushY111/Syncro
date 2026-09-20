import { describe, it, expect } from 'vitest';
import {
  ROLE_HIERARCHY,
  getUserWorkspaceRole,
  canManageWorkspace,
  canDeleteWorkspace,
  canRemoveMember,
  isProjectMember,
  canCreateTask,
  canManageWhiteboards,
} from './permissions.js';

describe('Client Permission Utilities', () => {
  it('should define correct role hierarchy levels', () => {
    expect(ROLE_HIERARCHY.OWNER).toBe(4);
    expect(ROLE_HIERARCHY.ADMIN).toBe(3);
    expect(ROLE_HIERARCHY.MANAGER).toBe(2);
    expect(ROLE_HIERARCHY.MEMBER).toBe(1);
  });

  describe('getUserWorkspaceRole', () => {
    it('returns OWNER when user is workspace owner', () => {
      const ws = { ownerId: 'user-1', members: [] };
      expect(getUserWorkspaceRole(ws, 'user-1')).toBe('OWNER');
    });

    it('returns member customRole or role', () => {
      const ws = {
        ownerId: 'owner-1',
        members: [{ userId: 'user-2', role: 'ADMIN', customRole: 'LEAD_DEV' }],
      };
      expect(getUserWorkspaceRole(ws, 'user-2')).toBe('LEAD_DEV');
    });

    it('returns MEMBER for unknown user or empty workspace', () => {
      expect(getUserWorkspaceRole(null, 'user-3')).toBe('MEMBER');
      expect(getUserWorkspaceRole({ ownerId: 'o-1', members: [] }, 'user-3')).toBe('MEMBER');
    });
  });

  describe('canManageWorkspace', () => {
    it('allows OWNER and ADMIN', () => {
      expect(canManageWorkspace('OWNER')).toBe(true);
      expect(canManageWorkspace('ADMIN')).toBe(true);
      expect(canManageWorkspace('MANAGER')).toBe(false);
      expect(canManageWorkspace('MEMBER')).toBe(false);
    });
  });

  describe('canDeleteWorkspace', () => {
    it('only allows the workspace owner', () => {
      const ws = { ownerId: 'user-1' };
      expect(canDeleteWorkspace(ws, 'user-1')).toBe(true);
      expect(canDeleteWorkspace(ws, 'user-2')).toBe(false);
    });
  });

  describe('canRemoveMember', () => {
    const ws = { ownerId: 'owner-1' };

    it('never allows removing the workspace owner', () => {
      expect(canRemoveMember('OWNER', 'OWNER', false, ws, 'owner-1')).toBe(false);
    });

    it('allows self removal', () => {
      expect(canRemoveMember('MEMBER', 'MEMBER', true, ws, 'user-2')).toBe(true);
    });

    it('allows OWNER to remove anyone else', () => {
      expect(canRemoveMember('OWNER', 'ADMIN', false, ws, 'user-2')).toBe(true);
      expect(canRemoveMember('OWNER', 'MEMBER', false, ws, 'user-2')).toBe(true);
    });

    it('allows ADMIN to remove MANAGER and MEMBER only', () => {
      expect(canRemoveMember('ADMIN', 'MEMBER', false, ws, 'user-2')).toBe(true);
      expect(canRemoveMember('ADMIN', 'MANAGER', false, ws, 'user-2')).toBe(true);
      expect(canRemoveMember('ADMIN', 'ADMIN', false, ws, 'user-2')).toBe(false);
    });
  });

  describe('Project and Task permissions', () => {
    it('correctly identifies project member', () => {
      const project = {
        team_lead: 'lead-1',
        members: [{ userId: 'mem-1' }],
      };
      expect(isProjectMember(project, 'lead-1')).toBe(true);
      expect(isProjectMember(project, 'mem-1')).toBe(true);
      expect(isProjectMember(project, 'stranger')).toBe(false);
    });

    it('allows OWNER to create tasks and manage whiteboards', () => {
      expect(canCreateTask('OWNER', {}, 'user-1', {})).toBe(true);
      expect(canManageWhiteboards('OWNER', {})).toBe(true);
    });
  });
});
