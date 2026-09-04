import { prisma } from '../../config/prisma.js';
import { redisCache } from '../../config/redis.js';
import { NotFoundError, BadRequestError } from '../../utils/errors/appError.js';
import { ApiResponse } from '../../utils/response/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

/**
 * List all active sessions for the authenticated user.
 */
export const listSessions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const currentJti = req.user.jti;

  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActiveAt: 'desc' },
  });

  const formattedSessions = sessions.map((s) => ({
    id: s.id,
    device: s.device || 'Unknown Device',
    ipAddress: s.ipAddress || 'Unknown IP',
    userAgent: s.userAgent || 'Unknown Browser',
    lastActiveAt: s.lastActiveAt,
    createdAt: s.createdAt,
    isCurrent: s.jti === currentJti,
  }));

  return ApiResponse.success(res, {
    data: { sessions: formattedSessions },
  });
});

/**
 * Revoke a specific session by session ID.
 */
export const revokeSession = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.params;

  const session = await prisma.userSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  await prisma.userSession.update({
    where: { id: session.id },
    data: { isRevoked: true },
  });

  // Blacklist JTI in Redis for immediate rejection
  if (session.jti) {
    try {
      await redisCache.set(`revoked:${session.jti}`, 'true', 7 * 24 * 60 * 60);
    } catch {}
  }

  return ApiResponse.success(res, {
    message: 'Session revoked successfully',
  });
});

/**
 * Revoke all other active sessions except the current one.
 */
export const revokeAllOtherSessions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const currentJti = req.user.jti;

  const otherSessions = await prisma.userSession.findMany({
    where: {
      userId,
      isRevoked: false,
      jti: { not: currentJti },
    },
    select: { id: true, jti: true },
  });

  if (otherSessions.length > 0) {
    await prisma.userSession.updateMany({
      where: {
        id: { in: otherSessions.map((s) => s.id) },
      },
      data: { isRevoked: true },
    });

    for (const s of otherSessions) {
      if (s.jti) {
        try {
          await redisCache.set(`revoked:${s.jti}`, 'true', 7 * 24 * 60 * 60);
        } catch {}
      }
    }
  }

  return ApiResponse.success(res, {
    data: { revokedCount: otherSessions.length },
    message: `Successfully revoked ${otherSessions.length} other active session(s)`,
  });
});

export default { listSessions, revokeSession, revokeAllOtherSessions };
