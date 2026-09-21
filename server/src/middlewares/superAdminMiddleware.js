import { prisma } from '../config/prisma.js';
import { redisCache } from '../config/redis.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors/appError.js';

/**
 * Super-Admin protection middleware.
 * Verifies that the authenticated user has super-admin privileges via:
 * 1. Matching process.env.SUPER_ADMIN_EMAILS whitelist
 * 2. Or isSuperAdmin boolean in database / Redis cache
 */
export const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase().trim();

    // Check environment whitelist fallback
    const configuredEmails = (process.env.SUPER_ADMIN_EMAILS || '')
      .toLowerCase()
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    if (configuredEmails.includes(userEmail)) {
      req.user.isSuperAdmin = true;
      return next();
    }

    // Check Redis cached admin status
    const cacheKey = `user:is_superadmin:${userId}`;
    const cachedAdmin = await redisCache.get(cacheKey);

    // See gatekeeperService.checkIsSuperAdmin for why both the string and
    // boolean forms are checked here (Upstash auto-deserializes a stored
    // 'true'/'false' string back into a real boolean; the in-memory
    // fallback does not).
    if (cachedAdmin === 'true' || cachedAdmin === true) {
      req.user.isSuperAdmin = true;
      return next();
    } else if (cachedAdmin === 'false' || cachedAdmin === false) {
      throw new ForbiddenError('Super-Admin access privileges required');
    }

    // Query DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isSuperAdmin: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.isSuperAdmin || configuredEmails.includes(user.email.toLowerCase().trim())) {
      await redisCache.set(cacheKey, 'true', 3600); // 1 hour cache
      req.user.isSuperAdmin = true;
      return next();
    }

    await redisCache.set(cacheKey, 'false', 300);
    throw new ForbiddenError('Super-Admin access privileges required');
  } catch (err) {
    next(err);
  }
};

export default { requireSuperAdmin };
