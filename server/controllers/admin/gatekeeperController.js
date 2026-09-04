import { prisma } from '../../config/prisma.js';
import { redisCache } from '../../config/redis.js';
import {
  getPlatformSettings,
  updatePlatformSettings,
  sendApprovalConfirmationEmail,
} from '../../services/gatekeeperService.js';
import { BadRequestError, NotFoundError } from '../../utils/errors/appError.js';
import { ApiResponse } from '../../utils/response/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

/**
 * Get platform settings and system overview metrics for Super-Admin dashboard.
 */
export const getGatekeeperOverview = asyncHandler(async (req, res) => {
  const settings = await getPlatformSettings();

  const [
    totalUsers,
    pendingUsersCount,
    totalWorkspaces,
    pendingWorkspacesCount,
    activeVipCodesCount,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { status: 'PENDING_APPROVAL', deletedAt: null } }),
    prisma.workspace.count({ where: { deletedAt: null } }),
    prisma.workspace.count({ where: { approvalStatus: 'PENDING', deletedAt: null } }),
    prisma.vipInviteCode.count({ where: { isActive: true } }),
  ]);

  return ApiResponse.success(res, {
    data: {
      settings,
      stats: {
        totalUsers,
        pendingUsersCount,
        totalWorkspaces,
        pendingWorkspacesCount,
        activeVipCodesCount,
      },
    },
  });
});

/**
 * Update dynamic platform gatekeeper policies.
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const {
    userRegistrationMode,
    workspaceCreationMode,
    whitelistedDomains,
    notifyAdminOnRequest,
    autoApproveInvitedMembers,
    customPendingMessage,
  } = req.body;

  const updates = {};
  if (userRegistrationMode && ['OPEN', 'APPROVAL_REQUIRED', 'INVITE_ONLY'].includes(userRegistrationMode)) {
    updates.userRegistrationMode = userRegistrationMode;
  }
  if (workspaceCreationMode && ['OPEN', 'APPROVAL_REQUIRED', 'INVITE_ONLY'].includes(workspaceCreationMode)) {
    updates.workspaceCreationMode = workspaceCreationMode;
  }
  if (Array.isArray(whitelistedDomains)) {
    updates.whitelistedDomains = whitelistedDomains
      .map((d) => String(d).trim().toLowerCase())
      .filter(Boolean);
  }
  if (typeof notifyAdminOnRequest === 'boolean') {
    updates.notifyAdminOnRequest = notifyAdminOnRequest;
  }
  if (typeof autoApproveInvitedMembers === 'boolean') {
    updates.autoApproveInvitedMembers = autoApproveInvitedMembers;
  }
  if (typeof customPendingMessage === 'string') {
    updates.customPendingMessage = customPendingMessage.trim();
  }

  const updated = await updatePlatformSettings(updates);

  return ApiResponse.success(res, {
    data: { settings: updated },
    message: 'Platform settings updated successfully',
  });
});

/**
 * Fetch all pending users and pending workspaces.
 */
export const getPendingRequests = asyncHandler(async (req, res) => {
  const [pendingUsers, pendingWorkspaces] = await Promise.all([
    prisma.user.findMany({
      where: { status: 'PENDING_APPROVAL', deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        status: true,
        createdAt: true,
        rejectionReason: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.workspace.findMany({
      where: { approvalStatus: 'PENDING', deletedAt: null },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return ApiResponse.success(res, {
    data: {
      pendingUsers,
      pendingWorkspaces,
    },
  });
});

/**
 * Approve a user account.
 */
export const approveUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'ACTIVE',
      rejectionReason: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      isSuperAdmin: true,
      updatedAt: true,
    },
  });

  // Invalidate redis cache for user
  try {
    await redisCache.del(`user:is_superadmin:${userId}`);
    await redisCache.del(`user:workspaces:${userId}`);
  } catch {}

  // Send confirmation email
  sendApprovalConfirmationEmail({
    to: user.email,
    userName: user.name,
    type: 'Account',
  }).catch(() => {});

  return ApiResponse.success(res, {
    data: { user: updatedUser },
    message: `Account for ${user.email} has been approved successfully`,
  });
});

/**
 * Reject a user account.
 */
export const rejectUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason = 'Application declined by administrator' } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      rejectionReason: true,
      updatedAt: true,
    },
  });

  return ApiResponse.success(res, {
    data: { user: updatedUser },
    message: `Account for ${user.email} has been rejected`,
  });
});

/**
 * Approve a workspace / organization request.
 */
export const approveWorkspace = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { owner: true },
  });

  if (!workspace) {
    throw new NotFoundError('Workspace not found');
  }

  const updatedWorkspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { approvalStatus: 'APPROVED' },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: true } },
    },
  });

  // Invalidate owner workspaces cache
  try {
    await redisCache.del(`user:workspaces:${workspace.ownerId}`);
  } catch {}

  // Send confirmation email to workspace owner
  if (workspace.owner?.email) {
    sendApprovalConfirmationEmail({
      to: workspace.owner.email,
      userName: workspace.owner.name,
      type: 'Workspace',
      entityName: workspace.name,
    }).catch(() => {});
  }

  return ApiResponse.success(res, {
    data: { workspace: updatedWorkspace },
    message: `Workspace "${workspace.name}" has been approved and provisioned`,
  });
});

/**
 * Reject a workspace request.
 */
export const rejectWorkspace = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { reason = 'Workspace request declined' } = req.body;

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    throw new NotFoundError('Workspace not found');
  }

  const updatedWorkspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      approvalStatus: 'REJECTED',
      requestNotes: reason,
    },
  });

  try {
    await redisCache.del(`user:workspaces:${workspace.ownerId}`);
  } catch {}

  return ApiResponse.success(res, {
    data: { workspace: updatedWorkspace },
    message: `Workspace "${workspace.name}" request rejected`,
  });
});

/**
 * List VIP invite codes.
 */
export const listVipCodes = asyncHandler(async (req, res) => {
  const codes = await prisma.vipInviteCode.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return ApiResponse.success(res, { data: { codes } });
});

/**
 * Create a VIP invite code.
 */
export const createVipCode = asyncHandler(async (req, res) => {
  const { code, scope = 'ALL_ACCESS', maxUses = 1, expiresAt, note } = req.body;

  let finalCode = (code || '').trim().toUpperCase();
  if (!finalCode) {
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    finalCode = `SYNCRO-VIP-${randomSuffix}`;
  }

  const existing = await prisma.vipInviteCode.findUnique({
    where: { code: finalCode },
  });

  if (existing) {
    throw new BadRequestError('A VIP code with this name already exists');
  }

  const vipCode = await prisma.vipInviteCode.create({
    data: {
      code: finalCode,
      scope: ['ALL_ACCESS', 'ACCOUNT_ONLY', 'ORG_ONLY'].includes(scope) ? scope : 'ALL_ACCESS',
      maxUses: Number(maxUses) >= 0 ? Number(maxUses) : 1,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      note: note ? String(note).trim() : null,
      createdById: req.user.id,
      isActive: true,
    },
  });

  return ApiResponse.created(res, {
    data: { vipCode },
    message: 'VIP Invite Code generated successfully',
  });
});

/**
 * Revoke or delete a VIP code.
 */
export const revokeVipCode = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vip = await prisma.vipInviteCode.findUnique({ where: { id } });
  if (!vip) {
    throw new NotFoundError('VIP Code not found');
  }

  await prisma.vipInviteCode.delete({ where: { id } });

  return ApiResponse.success(res, {
    message: 'VIP Code deleted/revoked successfully',
  });
});

/**
 * List all users with filtering for SuperAdmin.
 */
export const listAllUsers = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = { deletedAt: null };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        status: true,
        isSuperAdmin: true,
        rejectionReason: true,
        createdAt: true,
        workspaces: {
          select: {
            workspace: { select: { id: true, name: true, slug: true } },
            role: true,
          },
        },
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return ApiResponse.success(res, {
    data: {
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

/**
 * Toggle a user's Super-Admin status.
 */
export const toggleSuperAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.id === req.user.id) {
    throw new BadRequestError('Cannot modify your own Super-Admin status');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isSuperAdmin: !user.isSuperAdmin },
    select: { id: true, name: true, email: true, isSuperAdmin: true },
  });

  try {
    await redisCache.del(`user:is_superadmin:${userId}`);
  } catch {}

  return ApiResponse.success(res, {
    data: { user: updatedUser },
    message: `Super-Admin access for ${user.email} is now ${updatedUser.isSuperAdmin ? 'ENABLED' : 'DISABLED'}`,
  });
});
