/**
 * Enterprise Async Controller Wrapper.
 * Catches any unhandled promise rejections in async route handlers and passes them cleanly to Express error middleware.
 *
 * @param {Function} fn - Async controller function
 * @returns {Function} Express route handler
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch((err) => {
      if (typeof next === 'function') {
        return next(err);
      }
      throw err;
    });
  };
};

export default asyncHandler;
