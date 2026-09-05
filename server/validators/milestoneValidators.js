/**
 * DTO Request Validators for Milestone endpoints.
 */

export const validateCreateMilestone = (req) => {
  const { title, projectId, description } = req.body || {};

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return { error: { message: 'Milestone title is required and cannot be empty.' } };
  }

  if (title.trim().length > 150) {
    return { error: { message: 'Milestone title cannot exceed 150 characters.' } };
  }

  if (!projectId || typeof projectId !== 'string' || projectId.trim().length === 0) {
    return { error: { message: 'Valid projectId is required.' } };
  }

  if (description && typeof description === 'string' && description.trim().length > 1000) {
    return { error: { message: 'Milestone description cannot exceed 1000 characters.' } };
  }

  return null;
};

export const validateUpdateMilestone = (req) => {
  const { title, description } = req.body || {};

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return { error: { message: 'Milestone title cannot be empty.' } };
    }
    if (title.trim().length > 150) {
      return { error: { message: 'Milestone title cannot exceed 150 characters.' } };
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description === 'string' && description.trim().length > 1000) {
      return { error: { message: 'Milestone description cannot exceed 1000 characters.' } };
    }
  }

  return null;
};

export const validateLinkTasks = (req) => {
  const { taskIds } = req.body || {};

  if (!Array.isArray(taskIds)) {
    return { error: { message: 'taskIds must be an array.' } };
  }

  return null;
};

export default {
  validateCreateMilestone,
  validateUpdateMilestone,
  validateLinkTasks,
};
