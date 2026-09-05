import { ValidationError } from "../utils/errors/appError.js";

/**
 * Generic DTO Request Validator Middleware.
 * Validates request payload against a schema validation function.
 *
 * @param {Function} validatorFn - Function receiving req returning null or { error }
 */
export const validate = (validatorFn) => {
  return (req, res, next) => {
    try {
      const result = validatorFn(req);
      if (result && result.error) {
        return next(new ValidationError(result.error.message || "Invalid request parameters", result.error.details || null));
      }
      next();
    } catch (err) {
      next(new ValidationError(err.message));
    }
  };
};

export default validate;
