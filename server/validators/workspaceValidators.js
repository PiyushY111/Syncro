/**
 * DTO Request Validators for Workspace endpoints.
 */

const STANDARD_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];

export const validateCreateWorkspace = (req) => {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { error: { message: 'Workspace name is required and cannot be empty.' } };
  }
  if (name.trim().length > 100) {
    return { error: { message: 'Workspace name cannot exceed 100 characters.' } };
  }
  return null;
};

export const validateUpdateWorkspace = (req) => {
  const { name } = req.body || {};
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return { error: { message: 'Workspace name cannot be empty.' } };
    }
    if (name.trim().length > 100) {
      return { error: { message: 'Workspace name cannot exceed 100 characters.' } };
    }
  }
  return null;
};

export const validateMemberRole = (req) => {
  const { role, customRole } = req.body || {};
  if (!role && !customRole) {
    return { error: { message: 'Role or customRole is required.' } };
  }
  if (role && typeof role !== 'string') {
    return { error: { message: 'Role must be a valid string.' } };
  }
  return null;
};

export default {
  validateCreateWorkspace,
  validateUpdateWorkspace,
  validateMemberRole,
};
