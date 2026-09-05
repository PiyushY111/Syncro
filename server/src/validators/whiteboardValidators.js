/**
 * DTO Request Validators for Whiteboard endpoints.
 */

export const validateCreateWhiteboard = (req) => {
  const { workspaceId, name } = req.body || {};

  if (!workspaceId || typeof workspaceId !== 'string') {
    return { error: { message: 'workspaceId is required.' } };
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return { error: { message: 'Whiteboard name cannot be empty if specified.' } };
    }
    if (name.trim().length > 100) {
      return { error: { message: 'Whiteboard name cannot exceed 100 characters.' } };
    }
  }

  return null;
};

export const validateUpdateWhiteboard = (req) => {
  const { name, expectedVersion } = req.body || {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return { error: { message: 'Whiteboard name cannot be empty.' } };
    }
    if (name.trim().length > 100) {
      return { error: { message: 'Whiteboard name cannot exceed 100 characters.' } };
    }
  }

  if (expectedVersion !== undefined && (typeof expectedVersion !== 'number' || isNaN(expectedVersion))) {
    return { error: { message: 'expectedVersion must be a valid number.' } };
  }

  return null;
};

export default {
  validateCreateWhiteboard,
  validateUpdateWhiteboard,
};
