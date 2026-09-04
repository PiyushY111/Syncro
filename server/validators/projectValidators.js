/**
 * DTO Request Validators for Project endpoints.
 */

export const validateCreateProject = (req) => {
  const { name, workspaceId, start_date, end_date } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { error: { message: 'Project name is required and cannot be empty.' } };
  }

  if (name.trim().length > 100) {
    return { error: { message: 'Project name cannot exceed 100 characters.' } };
  }

  if (!workspaceId || typeof workspaceId !== 'string') {
    return { error: { message: 'workspaceId is required.' } };
  }

  if (start_date && end_date) {
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
      return { error: { message: 'Project end date cannot be earlier than start date.' } };
    }
  }

  return null;
};

export const validateUpdateProject = (req) => {
  const { name, start_date, end_date } = req.body || {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return { error: { message: 'Project name cannot be empty.' } };
    }
    if (name.trim().length > 100) {
      return { error: { message: 'Project name cannot exceed 100 characters.' } };
    }
  }

  if (start_date && end_date) {
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
      return { error: { message: 'Project end date cannot be earlier than start date.' } };
    }
  }

  return null;
};

export default {
  validateCreateProject,
  validateUpdateProject,
};
