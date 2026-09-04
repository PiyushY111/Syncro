/**
 * DTO Request Validators for Meeting endpoints.
 */

export const validateCreateMeeting = (req) => {
  const { title, workspaceId, start_time, end_time } = req.body || {};

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return { error: { message: 'Meeting title is required and cannot be empty.' } };
  }

  if (title.trim().length > 255) {
    return { error: { message: 'Meeting title cannot exceed 255 characters.' } };
  }

  if (!workspaceId || typeof workspaceId !== 'string') {
    return { error: { message: 'workspaceId is required.' } };
  }

  if (!start_time || !end_time) {
    return { error: { message: 'Start time and end time are required.' } };
  }

  const start = new Date(start_time);
  const end = new Date(end_time);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { error: { message: 'Invalid start or end date format.' } };
  }

  if (end <= start) {
    return { error: { message: 'Meeting end time must be after the start time.' } };
  }

  return null;
};

export const validateUpdateMeeting = (req) => {
  const { title, start_time, end_time } = req.body || {};

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return { error: { message: 'Meeting title cannot be empty.' } };
    }
    if (title.trim().length > 255) {
      return { error: { message: 'Meeting title cannot exceed 255 characters.' } };
    }
  }

  if (start_time && end_time) {
    const start = new Date(start_time);
    const end = new Date(end_time);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { error: { message: 'Invalid start or end date format.' } };
    }
    if (end <= start) {
      return { error: { message: 'Meeting end time must be after the start time.' } };
    }
  }

  return null;
};

export default {
  validateCreateMeeting,
  validateUpdateMeeting,
};
