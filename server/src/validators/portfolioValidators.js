/**
 * DTO Request Validators for Portfolio endpoints.
 */

export const validateCreatePortfolio = (req) => {
  const { name, workspaceId, description } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { error: { message: 'Portfolio name is required and cannot be empty.' } };
  }

  if (name.trim().length > 100) {
    return { error: { message: 'Portfolio name cannot exceed 100 characters.' } };
  }

  if (!workspaceId || typeof workspaceId !== 'string' || workspaceId.trim().length === 0) {
    return { error: { message: 'Valid workspaceId is required.' } };
  }

  if (description && typeof description === 'string' && description.trim().length > 1000) {
    return { error: { message: 'Portfolio description cannot exceed 1000 characters.' } };
  }

  return null;
};

export const validateUpdatePortfolio = (req) => {
  const { name, description } = req.body || {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return { error: { message: 'Portfolio name cannot be empty.' } };
    }
    if (name.trim().length > 100) {
      return { error: { message: 'Portfolio name cannot exceed 100 characters.' } };
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description === 'string' && description.trim().length > 1000) {
      return { error: { message: 'Portfolio description cannot exceed 1000 characters.' } };
    }
  }

  return null;
};

export const validatePortfolioProjects = (req) => {
  const { projectIds } = req.body || {};

  if (!Array.isArray(projectIds)) {
    return { error: { message: 'projectIds must be an array.' } };
  }

  return null;
};

export default {
  validateCreatePortfolio,
  validateUpdatePortfolio,
  validatePortfolioProjects,
};
