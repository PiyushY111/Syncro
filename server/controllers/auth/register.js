import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { eventBus } from '../../services/eventBus.js';
import { ConflictError } from '../../utils/errors/appError.js';
import { ApiResponse } from '../../utils/response/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { hashVerificationCode } from '../../utils/crypto.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  // Elevate work factor to 12 for GPU cracking resistance
  const passwordHash = await bcrypt.hash(password, 12);
  const isTester = normalizedEmail === 'google-tester@piyushydv.com';
  const verificationCode = isTester ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
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
