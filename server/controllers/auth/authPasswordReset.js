import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { executeTransaction } from '../../services/db/dbService.js';
import { eventBus } from '../../services/eventBus.js';
import sendEmail from '../../config/nodemailer.js';
import { BadRequestError } from '../../utils/errors/appError.js';
import { ApiResponse } from '../../utils/response/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { generatePasswordResetToken, hashToken } from '../../utils/crypto.js';

/**
 * Initiates the password recovery flow by generating a secure reset token.
 * Prevents account enumeration by returning a generic success message.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || !/\S+@\S+\.\S+/.test(email)) {
    throw new BadRequestError('A valid email address is required');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, name: true, deletedAt: true },
  });

  // Always return identical response to prevent email harvesting / enumeration
  const genericResponse = {
    message: 'If an account with that email exists, password reset instructions have been sent.',
  };

  if (!user || user.deletedAt) {
    return ApiResponse.success(res, genericResponse);
  }

  // Generate cryptographic token
  const { token, tokenHash, expiresAt } = generatePasswordResetToken(15);
  const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
  const userAgent = req.headers['user-agent'] || null;

  // Invalidate any older unused reset tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      usedAt: null,
    },
  });

  // Store token hash in database
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress: typeof ipAddress === 'string' ? ipAddress : null,
      userAgent: typeof userAgent === 'string' ? userAgent : null,
    },
  });

  const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0] : 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV PASSWORD RESET] User: ${user.email} | Token: ${token}`);
    console.log(`[DEV PASSWORD RESET] Link: ${resetUrl}`);
  }

  // Dispatch background event and email
  await eventBus
    .publish('app/auth.password_reset_requested', {
      userId: user.id,
      email: user.email,
      token,
      resetUrl,
      expiresAt,
    })
    .catch((err) => console.error('[forgotPassword] EventBus publish error:', err));

  try {
    const subject = '🔒 Reset Your Syncro Password';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Syncro Security</h2>
        </div>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Hi ${user.name || 'there'},
        </p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          We received a request to reset your password for your Syncro account. Click the button below to choose a new password. This link is valid for <strong>15 minutes</strong>.
        </p>
        <div style="margin: 28px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
            Reset Password &rarr;
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
    `;
    await sendEmail({ to: user.email, subject, html }).catch(() => {});
  } catch (emailErr) {
    console.warn('[forgotPassword] Email send warning:', emailErr.message);
  }

  return ApiResponse.success(res, genericResponse);
});

/**
 * Resets user password using a verified cryptographic token.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body || {};

  if (!token || typeof token !== 'string') {
    throw new BadRequestError('Password reset token is required');
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new BadRequestError('New password must be at least 8 characters long');
  }

  if (!/(?=.*[a-zA-Z])(?=.*[0-9!@#$%^&*])/.test(newPassword)) {
    throw new BadRequestError('Password must contain at least one letter and one number or special character');
  }

  const tokenHash = hashToken(token);
  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetRecord) {
    throw new BadRequestError('Invalid or expired password reset token');
  }

  if (resetRecord.usedAt !== null) {
    throw new BadRequestError('This password reset link has already been used');
  }

  if (new Date() > new Date(resetRecord.expiresAt)) {
    throw new BadRequestError('This password reset link has expired. Please request a new one.');
  }

  // Elevate work factor to 12
  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  // Atomic state mutation and session invalidation
  await executeTransaction(async (tx) => {
    // 1. Update user password
    await tx.user.update({
      where: { id: resetRecord.userId },
      data: {
        passwordHash: newPasswordHash,
        twoFactorCode: null,
        twoFactorExpires: null,
      },
    });

    // 2. Mark reset token as consumed
    await tx.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    });

    // 3. Revoke all active user sessions for security
    await tx.userSession.updateMany({
      where: { userId: resetRecord.userId },
      data: { isRevoked: true },
    });
  });

  await eventBus
    .publish('app/auth.password_reset_completed', {
      userId: resetRecord.userId,
      email: resetRecord.user.email,
    })
    .catch((err) => console.error('[resetPassword] EventBus publish error:', err));

  return ApiResponse.success(res, {
    message: 'Your password has been successfully reset. Please log in with your new credentials.',
  });
});

export default { forgotPassword, resetPassword };
