/**
 * DTO Request Validators for Comment endpoints.
 */

export const validateAddComment = (req) => {
  const { content, taskId } = req.body || {};

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return { error: { message: 'Comment content cannot be empty.' } };
  }

  if (content.trim().length > 5000) {
    return { error: { message: 'Comment content cannot exceed 5000 characters.' } };
  }

  if (!taskId || typeof taskId !== 'string' || taskId.trim().length === 0) {
    return { error: { message: 'Valid taskId is required.' } };
  }

  return null;
};

export default {
  validateAddComment,
};
