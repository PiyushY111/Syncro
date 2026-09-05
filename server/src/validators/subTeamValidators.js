/**
 * DTO Request Validators for SubTeam endpoints.
 */

export const validateCreateSubTeam = (req) => {
  const { name, workspaceId, description } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { error: { message: 'Sub-team name is required.' } };
  }

  if (name.trim().length > 100) {
    return { error: { message: 'Sub-team name cannot exceed 100 characters.' } };
  }

  if (description && typeof description === 'string' && description.trim().length > 500) {
    return { error: { message: 'Description cannot exceed 500 characters.' } };
  }

  if (!workspaceId || typeof workspaceId !== 'string' || workspaceId.trim().length === 0) {
    return { error: { message: 'Valid workspaceId is required.' } };
  }

  return null;
};

export const validateUpdateSubTeam = (req) => {
  const { name, description, projectId } = req.body || {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return { error: { message: 'Sub-team name cannot be empty.' } };
    }
    if (name.trim().length > 100) {
      return { error: { message: 'Sub-team name cannot exceed 100 characters.' } };
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description === 'string' && description.trim().length > 500) {
      return { error: { message: 'Description cannot exceed 500 characters.' } };
    }
  }

  if (projectId !== undefined && projectId !== null && typeof projectId !== 'string') {
    return { error: { message: 'projectId must be a string or null.' } };
  }

  return null;
};

export const validateAddSubTeamMember = (req) => {
  const { userId } = req.body || {};

  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return { error: { message: 'Valid userId is required.' } };
  }

  return null;
};

export default {
  validateCreateSubTeam,
  validateUpdateSubTeam,
  validateAddSubTeamMember,
};
