import { redisCache } from '../config/redis.js';
import { RateLimitError } from '../utils/errors/appError.js';

/**
 * Enterprise Rate Limiting Middleware for Auth endpoints.
 * Prevents brute force and credential stuffing attacks by tracking IP + request targets.
 *
 * @param {Object} options
 * @param {number} [options.windowMs=900000] - Window duration in milliseconds (default 15 minutes)
 * @param {number} [options.maxAttempts=5] - Maximum allowed attempts per window
 * @param {string} [options.prefix='auth:limiter:'] - Cache key prefix
 */
export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    maxAttempts = 5,
    prefix = 'auth:limiter:',
  } = options;

  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req, res, next) => {
    try {
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';
      const targetIdentifier = req.body?.email || req.body?.userId || '';
      const key = `${prefix}${clientIp}:${targetIdentifier}`;

      const currentAttempts = await redisCache.incrWithTtl(key, windowSeconds);

      res.setHeader('X-RateLimit-Limit', maxAttempts);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxAttempts - currentAttempts));

      if (currentAttempts > maxAttempts) {
        res.setHeader('Retry-After', windowSeconds);
        return next(new RateLimitError(`Too many attempts from this IP/User. Please try again in ${Math.ceil(windowSeconds / 60)} minutes.`));
      }

      next();
    } catch (err) {
      console.warn('[RATE LIMITER ERROR]', err.message);
      // Fail open on rate limiter cache errors to preserve uptime
      next();
    }
  };
};

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  prefix: 'auth:limiter:strict:',
});

export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxAttempts: 100,
  prefix: 'api:limiter:general:',
});
