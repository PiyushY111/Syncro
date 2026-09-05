/**
 * DTO Request Validators for Chat endpoints.
 */

export const validateCreateChannel = (req) => {
  const { name, workspaceId } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { error: { message: 'Channel name is required and cannot be empty.' } };
  }

  if (name.trim().length > 100) {
    return { error: { message: 'Channel name cannot exceed 100 characters.' } };
  }

  if (!workspaceId || typeof workspaceId !== 'string' || workspaceId.trim().length === 0) {
    return { error: { message: 'Valid workspaceId is required.' } };
  }

  return null;
};

export const validateUpdateChannel = (req) => {
  const { name, description } = req.body || {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return { error: { message: 'Channel name cannot be empty.' } };
    }
    if (name.trim().length > 100) {
      return { error: { message: 'Channel name cannot exceed 100 characters.' } };
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description === 'string' && description.trim().length > 1000) {
      return { error: { message: 'Channel description cannot exceed 1000 characters.' } };
    }
  }

  return null;
};

export const validateSendMessage = (req) => {
  const { content, channelId, recipientId } = req.body || {};

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return { error: { message: 'Message content cannot be empty.' } };
  }

  if (!channelId && !recipientId) {
    return { error: { message: 'A channelId or recipientId must be provided.' } };
  }

  return null;
};

export default {
  validateCreateChannel,
  validateUpdateChannel,
  validateSendMessage,
};
