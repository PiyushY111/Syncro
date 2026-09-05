/**
 * DTO Request Validators for Audit Log endpoints.
 */

export const validateRollback = (req) => {
  const { logId } = req.body || {};

  if (!logId || typeof logId !== 'string' || logId.trim().length === 0) {
    return { error: { message: 'logId is required for rollback.' } };
  }

  return null;
};

export default {
  validateRollback,
};
