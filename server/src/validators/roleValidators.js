/**
 * DTO Request Validators for Role & Permission endpoints.
 */

export const validateRoleMatrix = (req) => {
  const { roleMatrix } = req.body || {};

  if (!roleMatrix || typeof roleMatrix !== 'object' || Array.isArray(roleMatrix)) {
    return { error: { message: 'roleMatrix must be a valid object.' } };
  }

  return null;
};

export const validateUpdateMemberRole = (req) => {
  const { memberUserId, role } = req.body || {};

  if (!memberUserId || typeof memberUserId !== 'string' || memberUserId.trim().length === 0) {
    return { error: { message: 'Valid memberUserId is required.' } };
  }

  if (!role || typeof role !== 'string' || role.trim().length === 0) {
    return { error: { message: 'Valid role is required.' } };
  }

  return null;
};

export const validateCustomRole = (req) => {
  const { roleKey, roleName } = req.body || {};

  if (!roleKey || typeof roleKey !== 'string' || roleKey.trim().length === 0) {
    return { error: { message: 'roleKey is required.' } };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(roleKey.trim())) {
    return { error: { message: 'roleKey can only contain alphanumeric characters and underscores.' } };
  }

  if (!roleName || typeof roleName !== 'string' || roleName.trim().length === 0) {
    return { error: { message: 'roleName is required and cannot be empty.' } };
  }

  return null;
};

export default {
  validateRoleMatrix,
  validateUpdateMemberRole,
  validateCustomRole,
};
