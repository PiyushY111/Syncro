/**
 * Enterprise Production Structured Telemetry Logger.
 * Formats log entries as structured JSON with level, timestamp, correlation IDs, and context.
 */

const LOG_LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
};

const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

const formatLogEntry = (level, message, context = {}) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: context.requestId || context.req?.headers?.["x-request-id"] || undefined,
    environment: process.env.NODE_ENV || "development",
    ...context,
  });
};

export const logger = {
  info: (message, context = {}) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
      console.log(formatLogEntry("INFO", message, context));
    }
  },
  warn: (message, context = {}) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(formatLogEntry("WARN", message, context));
    }
  },
  error: (message, context = {}) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(formatLogEntry("ERROR", message, context));
    }
  },
  debug: (message, context = {}) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      console.log(formatLogEntry("DEBUG", message, context));
    }
  },
};

export default logger;
