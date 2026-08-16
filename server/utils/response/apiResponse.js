/**
 * Enterprise Unified API Response Contract Formatter.
 */
export class ApiResponse {
  /**
   * Send a successful JSON response (200 OK by default).
   */
  static success(res, { data = null, message = "Success", statusCode = 200, meta = undefined }) {
    const payload = {
      success: true,
      message,
      data,
    };
    if (meta !== undefined) {
      payload.meta = meta;
    }
    return res.status(statusCode).json(payload);
  }

  /**
   * Send a resource created JSON response (201 Created).
   */
  static created(res, { data = null, message = "Resource created successfully" }) {
    return this.success(res, { data, message, statusCode: 201 });
  }

  /**
   * Send a no content response (204 No Content).
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Send a formatted error JSON response.
   */
  static error(res, { message = "An error occurred", statusCode = 500, errorCode = "INTERNAL_SERVER_ERROR", details = null }) {
    const payload = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details ? { details } : {}),
      },
    };

    if (process.env.NODE_ENV === "development" && details?.stack) {
      payload.error.stack = details.stack;
    }

    return res.status(statusCode).json(payload);
  }
}

export default ApiResponse;
