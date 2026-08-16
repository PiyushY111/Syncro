import { randomUUID } from "crypto";

/**
 * Enterprise Request Correlation ID Middleware.
 * Generates or propagates a unique x-request-id header for request tracing across services.
 */
export const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || randomUUID();
  req.id = requestId;
  req.headers["x-request-id"] = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};

export default requestIdMiddleware;
