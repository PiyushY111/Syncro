import jwt from 'jsonwebtoken';
import { redisCache } from '../config/redis.js';
import { UnauthorizedError } from '../utils/errors/appError.js';

/**
 * Express protection middleware verifying JWT validity and checking Redis token revocation list.
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const cookieToken = req.cookies?.syncro_access_token;
    const token = headerToken || cookieToken;

    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Check token revocation blacklist in Redis
    if (payload.jti) {
      const isRevoked = await redisCache.get(`revoked:${payload.jti}`);
      if (isRevoked) {
        throw new UnauthorizedError('Token has been revoked');
      }
    }

    req.user = {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      jti: payload.jti,
    };

    // Extract workspace ID from header if present for tenant scoping
    const workspaceHeader = req.headers['x-workspace-id'];
    if (workspaceHeader) {
      req.workspaceId = String(workspaceHeader);
    }

    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: err.message } });
    }
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired access token' } });
  }
};

/**
 * Revokes a JWT token JTI by storing it in Redis with the remaining token TTL.
 *
 * @param {string} jti - JWT unique token identifier
 * @param {number} [ttlSeconds=900] - Remaining lifetime in seconds
 */
export const revokeToken = async (jti, ttlSeconds = 900) => {
  if (!jti) return;
  await redisCache.set(`revoked:${jti}`, 'true', ttlSeconds);
};

export default {
  protect,
  revokeToken,
};