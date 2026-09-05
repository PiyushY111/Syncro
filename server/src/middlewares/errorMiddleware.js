import { AppError } from "../utils/errors/appError.js";
import { ApiResponse } from "../utils/response/apiResponse.js";
import { logger } from "../utils/logger/logger.js";

/**
 * Enterprise Centralized Global Express Error Handling Middleware.
 */
export const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // Transform non-AppError exceptions into operational AppErrors
  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || "An unexpected internal server error occurred";
    error = new AppError(message, statusCode, "INTERNAL_SERVER_ERROR", {
      originalError: error.name,
      stack: error.stack,
    });
  }

  // Log structured error telemetry
  logger.error(error.message, {
    requestId: req.id || req.headers?.["x-request-id"],
    path: req.originalUrl,
    method: req.method,
    statusCode: error.statusCode,
    errorCode: error.errorCode,
    stack: error.stack,
  });

  return ApiResponse.error(res, {
    message: error.message,
    statusCode: error.statusCode,
    errorCode: error.errorCode,
    details: error.details,
  });
};

export default errorMiddleware;
