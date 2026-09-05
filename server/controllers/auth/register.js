import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { eventBus } from '../../services/eventBus.js';
import { ConflictError, BadRequestError } from '../../utils/errors/appError.js';
import { ApiResponse } from '../../utils/response/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { hashVerificationCode } from '../../utils/crypto.js';
import {
  resolveUserRegistrationPolicy,
  notifySuperAdminOfPendingRequest,
} from '../../services/gatekeeperService.js';
import { createAccessToken, createRefreshToken, sanitizeUser, ACCESS_COOKIE_OPTIONS, COOKIE_OPTIONS } from './verify.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, inviteCode } = req.body;
  if (!name || !email || !password) {
    throw new BadRequestError('Name, email, and password are required');
  }
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  // Resolve gatekeeper policy
  const policy = await resolveUserRegistrationPolicy({
    email: normalizedEmail,
    inviteCode,
  });

  // Elevate work factor to 12 for GPU cracking resistance
  const passwordHash = await bcrypt.hash(password, 12);

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = hashVerificationCode(verificationCode);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV 2FA CODE] User: ${normalizedEmail} | Verification Code: ${verificationCode}`);
  }

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      status: policy.status,
      isSuperAdmin: policy.isSuperAdmin,
      twoFactorCode: hashedCode,
      twoFactorExpires: expiresAt,
    },
  });

  // If pending approval, alert super admin
  if (policy.status === 'PENDING_APPROVAL') {
    notifySuperAdminOfPendingRequest({
      type: 'User Registration',
      title: `${name.trim()} (${normalizedEmail})`,
      details: {
        Name: name.trim(),
        Email: normalizedEmail,
        Status: 'PENDING_APPROVAL',
        RegisteredAt: new Date().toISOString(),
      },
    }).catch(() => {});
  }

  eventBus
    .publish('app/auth.registered', {
      email: user.email,
      verificationCode,
    })
    .catch((err) => console.error('[register] Event publishing error:', err));

  return ApiResponse.created(res, {
    data: {
      requiresVerification: true,
      email: user.email,
      requiresApproval: policy.requiresApproval,
      status: policy.status,
    },
    message: 'Verification code sent to your email',
  });
});

export default register;

