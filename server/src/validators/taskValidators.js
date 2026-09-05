/**
 * DTO Request Validators for Task endpoints.
 */

const VALID_TASK_TYPES = ['TASK', 'BUG', 'FEATURE', 'IMPROVEMENT', 'OTHER'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

export const validateCreateTask = (req) => {
  const { title, projectId, type, priority } = req.body || {};

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return { error: { message: 'Task title is required and cannot be empty.' } };
  }

  if (title.trim().length > 255) {
    return { error: { message: 'Task title cannot exceed 255 characters.' } };
  }

  if (!projectId || typeof projectId !== 'string' || projectId.trim().length === 0) {
    return { error: { message: 'Valid projectId is required.' } };
  }

  if (type && !VALID_TASK_TYPES.includes(type)) {
    return { error: { message: `Task type must be one of: ${VALID_TASK_TYPES.join(', ')}` } };
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return { error: { message: `Task priority must be one of: ${VALID_PRIORITIES.join(', ')}` } };
  }

  return null;
};

export const validateUpdateTask = (req) => {
  const { title, priority, type, dependenciesIds, expectedVersion } = req.body || {};

  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    return { error: { message: 'Task title cannot be empty.' } };
  }

  if (title && title.trim().length > 255) {
    return { error: { message: 'Task title cannot exceed 255 characters.' } };
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return { error: { message: `Task priority must be one of: ${VALID_PRIORITIES.join(', ')}` } };
  }

  if (type && !VALID_TASK_TYPES.includes(type)) {
    return { error: { message: `Task type must be one of: ${VALID_TASK_TYPES.join(', ')}` } };
  }

  if (dependenciesIds !== undefined && !Array.isArray(dependenciesIds)) {
    return { error: { message: 'dependenciesIds must be an array of task IDs.' } };
  }

  if (expectedVersion !== undefined && (typeof expectedVersion !== 'number' || isNaN(expectedVersion))) {
    return { error: { message: 'expectedVersion must be a valid number.' } };
  }

  return null;
};

export default {
  validateCreateTask,
  validateUpdateTask,
};
