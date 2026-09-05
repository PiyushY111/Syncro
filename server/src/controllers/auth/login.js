import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { eventBus } from '../../services/eventBus.js';
import { UnauthorizedError, BadRequestError } from '../../utils/errors/appError.js';
import { ApiResponse } from '../../utils/response/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { hashVerificationCode } from '../../utils/crypto.js';
import { createAccessToken, createRefreshToken, sanitizeUser, ACCESS_COOKIE_OPTIONS, COOKIE_OPTIONS } from './verify.js';
import logger from '../../utils/logger/logger.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError('Email and password are required');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = hashVerificationCode(verificationCode);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[DEV 2FA CODE] User: ${user.email} | Verification Code: ${verificationCode}`, { email: user.email, verificationCode });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorCode: hashedCode,
      twoFactorExpires: expiresAt,
    },
  });

  eventBus
    .publish('app/auth.login_code_requested', {
      email: user.email,
      verificationCode,
    })
    .catch((err) => logger.error('[login] Failed to publish login code event:', { error: err.message }));

  return ApiResponse.success(res, {
    data: {
      requiresVerification: true,
      email: user.email,
    },
    message: 'Verification code sent to your email',
  });
});

export default login;
