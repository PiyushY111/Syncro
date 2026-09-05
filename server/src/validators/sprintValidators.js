/**
 * DTO Request Validators for Sprint & Retro endpoints.
 */

export const validateCreateSprint = (req) => {
  const { name, startDate, endDate } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { error: { message: 'Sprint name is required and cannot be empty.' } };
  }

  if (name.trim().length > 100) {
    return { error: { message: 'Sprint name cannot exceed 100 characters.' } };
  }

  if (!startDate || !endDate) {
    return { error: { message: 'Start date and end date are required.' } };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { error: { message: 'Invalid start or end date format.' } };
  }

  if (end <= start) {
    return { error: { message: 'Sprint end date must be after start date.' } };
  }

  return null;
};

export const validateRetroItem = (req) => {
  const { content } = req.body || {};

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return { error: { message: 'Retro feedback content cannot be empty.' } };
  }

  if (content.trim().length > 1000) {
    return { error: { message: 'Retro feedback content cannot exceed 1000 characters.' } };
  }

  return null;
};

export default {
  validateCreateSprint,
  validateRetroItem,
};
