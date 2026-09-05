/**
 * DTO Request Validators for Epic endpoints.
 */

export const validateCreateEpic = (req) => {
  const { name, description } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { error: { message: 'Epic name is required and cannot be empty.' } };
  }

  if (name.trim().length > 100) {
    return { error: { message: 'Epic name cannot exceed 100 characters.' } };
  }

  if (description && typeof description === 'string' && description.trim().length > 1000) {
    return { error: { message: 'Epic description cannot exceed 1000 characters.' } };
  }

  return null;
};

export const validateUpdateEpic = (req) => {
  const { name, description } = req.body || {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return { error: { message: 'Epic name cannot be empty.' } };
    }
    if (name.trim().length > 100) {
      return { error: { message: 'Epic name cannot exceed 100 characters.' } };
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description === 'string' && description.trim().length > 1000) {
      return { error: { message: 'Epic description cannot exceed 1000 characters.' } };
    }
  }

  return null;
};

export default {
  validateCreateEpic,
  validateUpdateEpic,
};
