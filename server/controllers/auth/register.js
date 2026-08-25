import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { eventBus } from '../../services/eventBus.js';
import { ConflictError, BadRequestError } from '../../utils/errors/appError.js';
import { ApiResponse } from '../../utils/response/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { hashVerificationCode } from '../../utils/crypto.js';
import { createAccessToken, createRefreshToken, sanitizeUser, ACCESS_COOKIE_OPTIONS, COOKIE_OPTIONS } from './verify.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new BadRequestError('Name, email, and password are required');
  }
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  // Elevate work factor to 12 for GPU cracking resistance
  const passwordHash = await bcrypt.hash(password, 12);
  const isTester = normalizedEmail === 'google-tester@piyushydv.com';

  if (isTester) {
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        twoFactorCode: null,
        twoFactorExpires: null,
      },
    });

    const { token: accessToken } = createAccessToken(user);
    const { refreshToken } = createRefreshToken(user);

    res.cookie('syncro_access_token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('syncro_refresh_token', refreshToken, COOKIE_OPTIONS);

    return ApiResponse.created(res, {
      data: {
        requiresVerification: false,
        token: accessToken,
        user: sanitizeUser(user),
      },
      message: 'Account created and logged in successfully',
    });
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = hashVerificationCode(verificationCode);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      twoFactorCode: hashedCode,
      twoFactorExpires: expiresAt,
    },
  });

  eventBus
    .publish('app/auth.registered', {
      email: user.email,
      verificationCode,
      isTester,
    })
    .catch((err) => console.error('[register] Event publishing error:', err));

  return ApiResponse.created(res, {
    data: {
      requiresVerification: true,
      email: user.email,
    },
    message: 'Verification code sent to your email',
  });
});

export default register;
