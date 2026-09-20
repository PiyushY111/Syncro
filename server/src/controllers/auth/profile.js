import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, BadRequestError, UnauthorizedError } from '../../utils/errors/appError.js';
import { ApiResponse } from '../../utils/response/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { issueCsrfCookie } from '../../middlewares/csrf.js';

const CSRF_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      status: true,
      isSuperAdmin: true,
      rejectionReason: true,
      googleCalendarSync: true,
      googleCalendarEmail: true,
      starredChannelIds: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .toLowerCase()
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  const normalizedEmail = (user.email || '').toLowerCase().trim();
  const isSuperAdmin = Boolean(user.isSuperAdmin || superAdminEmails.includes(normalizedEmail));

  // Re-issue the CSRF anchor so a page reload (which loses the in-memory copy the
  // client held from login) restores CSRF capability without forcing a re-login.
  const csrfToken = issueCsrfCookie(res, CSRF_COOKIE_MAX_AGE_MS);

  return ApiResponse.success(res, {
    data: {
      user: {
        ...user,
        isSuperAdmin,
      },
      csrfToken,
    },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, image } = req.body;

  if (!name?.trim()) {
    throw new BadRequestError('Name is required');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name.trim(),
      image: image ? image.trim() : '',
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      googleCalendarSync: true,
      googleCalendarEmail: true,
      starredChannelIds: true,
      createdAt: true,
    },
  });

  return ApiResponse.success(res, {
    data: { user },
    message: 'Profile updated successfully',
  });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Current and new passwords are required');
  }

  if (newPassword.length < 6) {
    throw new BadRequestError('New password must be at least 6 characters');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) {
    throw new NotFoundError('User not found');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid current password');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return ApiResponse.success(res, { message: 'Password updated successfully' });
});

export const updateGoogleSync = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { googleCalendarSync, googleCalendarEmail, googleAccessToken, googleRefreshToken } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      googleCalendarSync: !!googleCalendarSync,
      googleCalendarEmail: googleCalendarEmail !== undefined ? googleCalendarEmail?.trim() || null : undefined,
      googleAccessToken: googleAccessToken !== undefined ? googleAccessToken || null : undefined,
      googleRefreshToken: googleRefreshToken !== undefined ? googleRefreshToken || null : undefined,
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      googleCalendarSync: true,
      googleCalendarEmail: true,
      googleAccessToken: true,
      googleRefreshToken: true,
      createdAt: true,
    },
  });

  return ApiResponse.success(res, {
    data: { user },
    message: 'Google Calendar sync updated successfully',
  });
});

export default { me, updateProfile, updatePassword, updateGoogleSync };
