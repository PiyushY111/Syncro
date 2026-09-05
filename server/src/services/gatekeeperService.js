import { prisma } from '../config/prisma.js';
import { redisCache } from '../config/redis.js';
import sendEmail from '../config/nodemailer.js';
import { BadRequestError, NotFoundError } from '../utils/errors/appError.js';

const SETTINGS_KEY = 'gatekeeper_config';
const CACHE_KEY = 'platform:settings:gatekeeper';

export const DEFAULT_PLATFORM_SETTINGS = {
  userRegistrationMode: 'APPROVAL_REQUIRED', // 'OPEN' | 'APPROVAL_REQUIRED' | 'INVITE_ONLY'
  workspaceCreationMode: 'APPROVAL_REQUIRED', // 'OPEN' | 'APPROVAL_REQUIRED' | 'INVITE_ONLY'
  whitelistedDomains: [],
  notifyAdminOnRequest: true,
  autoApproveInvitedMembers: true,
  customPendingMessage: 'Your access request has been received and is awaiting Super-Admin approval. You will be notified via email once approved.',
};

/**
 * Retrieves the platform gatekeeper configuration with Redis caching.
 */
export const getPlatformSettings = async () => {
  try {
    const cached = await redisCache.get(CACHE_KEY);
    if (cached) {
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }
  } catch {}

  let settingRecord = null;
  try {
    settingRecord = await prisma.platformSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    if (!settingRecord) {
      settingRecord = await prisma.platformSetting.create({
        data: {
          key: SETTINGS_KEY,
          value: DEFAULT_PLATFORM_SETTINGS,
        },
      });
    }
  } catch {
    // Fallback gracefully when database is offline or during initial startup
  }

  const settings = {
    ...DEFAULT_PLATFORM_SETTINGS,
    ...(settingRecord?.value || {}),
  };

  try {
    await redisCache.set(CACHE_KEY, JSON.stringify(settings), 3600);
  } catch {}

  return settings;
};

/**
 * Updates platform gatekeeper configuration and invalidates cache.
 */
export const updatePlatformSettings = async (updates) => {
  const currentSettings = await getPlatformSettings();
  const merged = { ...currentSettings, ...updates };

  const updatedRecord = await prisma.platformSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: merged },
    update: { value: merged },
  });

  try {
    await redisCache.set(CACHE_KEY, JSON.stringify(merged), 3600);
  } catch {}

  return updatedRecord.value;
};

/**
 * Checks if an email address belongs to any whitelisted domain.
 */
export const isDomainWhitelisted = (email, domains = []) => {
  if (!email || !Array.isArray(domains) || domains.length === 0) return false;
  const normalizedEmail = email.toLowerCase().trim();
  const domainPart = normalizedEmail.split('@')[1];
  if (!domainPart) return false;

  return domains.some((d) => {
    const cleanDomain = d.replace(/^@/, '').toLowerCase().trim();
    return domainPart === cleanDomain || domainPart.endsWith(`.${cleanDomain}`);
  });
};

/**
 * Validates and redeems a VIP invite code.
 */
export const validateAndRedeemVipCode = async (code, requiredScope = 'ALL_ACCESS') => {
  if (!code || typeof code !== 'string') return null;
  const normalizedCode = code.trim().toUpperCase();

  const invite = await prisma.vipInviteCode.findUnique({
    where: { code: normalizedCode },
  });

  if (!invite || !invite.isActive) {
    throw new BadRequestError('Invalid or deactivated VIP invite code');
  }

  if (invite.expiresAt && new Date() > new Date(invite.expiresAt)) {
    throw new BadRequestError('This VIP invite code has expired');
  }

  if (invite.maxUses > 0 && invite.usedCount >= invite.maxUses) {
    throw new BadRequestError('This VIP invite code has reached its maximum usage limit');
  }

  if (
    invite.scope !== 'ALL_ACCESS' &&
    invite.scope !== requiredScope
  ) {
    throw new BadRequestError(`This VIP code is only valid for ${invite.scope.replace('_', ' ').toLowerCase()}`);
  }

  // Increment usage count
  const nextUsedCount = invite.usedCount + 1;
  const shouldDeactivate = invite.maxUses > 0 && nextUsedCount >= invite.maxUses;

  await prisma.vipInviteCode.update({
    where: { id: invite.id },
    data: {
      usedCount: nextUsedCount,
      isActive: shouldDeactivate ? false : invite.isActive,
    },
  });

  return invite;
};

/**
 * Verifies whether a user has Super-Admin authorization through env whitelist, DB, or Redis cache.
 */
export const checkIsSuperAdmin = async (user) => {
  if (!user) return false;
  if (user.isSuperAdmin === true) return true;

  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .toLowerCase()
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  const normalizedEmail = (user.email || '').toLowerCase().trim();
  if (normalizedEmail && superAdminEmails.includes(normalizedEmail)) {
    return true;
  }

  if (user.id) {
    try {
      const cacheKey = `user:is_superadmin:${user.id}`;
      const cached = await redisCache.get(cacheKey);
      if (cached === 'true') return true;
      if (cached === 'false') return false;

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { isSuperAdmin: true, email: true },
      });
      if (dbUser) {
        const isAdmin = Boolean(
          dbUser.isSuperAdmin ||
          (dbUser.email && superAdminEmails.includes(dbUser.email.toLowerCase().trim()))
        );
        await redisCache.set(cacheKey, isAdmin ? 'true' : 'false', isAdmin ? 3600 : 300);
        return isAdmin;
      }
    } catch {}
  }
  return false;
};

/**
 * Resolves user registration status and approval requirement.
 */
export const resolveUserRegistrationPolicy = async ({ email, inviteCode, isInvited = false }) => {
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .toLowerCase()
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  const normalizedEmail = (email || '').toLowerCase().trim();

  // Root Super-Admin check
  if (normalizedEmail && superAdminEmails.includes(normalizedEmail)) {
    return {
      status: 'ACTIVE',
      isSuperAdmin: true,
      requiresApproval: false,
      reason: 'Super-Admin Account',
    };
  }

  const settings = await getPlatformSettings();

  // Invited members bypass if auto-approval enabled
  if (isInvited && settings.autoApproveInvitedMembers) {
    return {
      status: 'ACTIVE',
      isSuperAdmin: false,
      requiresApproval: false,
      reason: 'Invited Member',
    };
  }

  // Check VIP code
  if (inviteCode) {
    const vip = await validateAndRedeemVipCode(inviteCode, 'ACCOUNT_ONLY');
    if (vip) {
      return {
        status: 'ACTIVE',
        isSuperAdmin: false,
        requiresApproval: false,
        reason: `VIP Code Bypass (${vip.code})`,
      };
    }
  }

  // Domain whitelist bypass
  if (isDomainWhitelisted(normalizedEmail, settings.whitelistedDomains)) {
    return {
      status: 'ACTIVE',
      isSuperAdmin: false,
      requiresApproval: false,
      reason: 'Whitelisted Domain',
    };
  }

  // Policy-based decision
  if (settings.userRegistrationMode === 'OPEN') {
    return {
      status: 'ACTIVE',
      isSuperAdmin: false,
      requiresApproval: false,
      reason: 'Open Registration Mode',
    };
  }

  if (settings.userRegistrationMode === 'INVITE_ONLY') {
    throw new BadRequestError('Registration is currently invite-only. A valid VIP invite code is required.');
  }

  // Default APPROVAL_REQUIRED
  return {
    status: 'PENDING_APPROVAL',
    isSuperAdmin: false,
    requiresApproval: true,
    reason: 'Approval Required',
  };
};

/**
 * Resolves workspace creation status and approval requirement.
 */
export const resolveWorkspaceCreationPolicy = async ({ user, inviteCode }) => {
  const isSuperAdmin = await checkIsSuperAdmin(user);
  if (isSuperAdmin) {
    return {
      approvalStatus: 'APPROVED',
      requiresApproval: false,
      reason: 'Super-Admin Bypass',
    };
  }

  const normalizedEmail = (user?.email || '').toLowerCase().trim();
  const settings = await getPlatformSettings();

  // VIP code bypass
  if (inviteCode) {
    const vip = await validateAndRedeemVipCode(inviteCode, 'ORG_ONLY');
    if (vip) {
      return {
        approvalStatus: 'APPROVED',
        requiresApproval: false,
        reason: `VIP Code Bypass (${vip.code})`,
      };
    }
  }

  // Domain whitelist bypass
  if (isDomainWhitelisted(normalizedEmail, settings.whitelistedDomains)) {
    return {
      approvalStatus: 'APPROVED',
      requiresApproval: false,
      reason: 'Whitelisted Domain',
    };
  }

  // Policy check
  if (settings.workspaceCreationMode === 'OPEN') {
    return {
      approvalStatus: 'APPROVED',
      requiresApproval: false,
      reason: 'Open Workspace Creation Mode',
    };
  }

  if (settings.workspaceCreationMode === 'INVITE_ONLY') {
    throw new BadRequestError('Workspace creation is invite-only. A valid VIP invite code is required.');
  }

  return {
    approvalStatus: 'PENDING',
    requiresApproval: true,
    reason: 'Approval Required',
  };
};

/**
 * Sends a notification email to Super-Admin regarding a new pending request.
 */
export const notifySuperAdminOfPendingRequest = async ({ type, title, details }) => {
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAILS || '').split(',')[0]?.trim();
  if (!superAdminEmail) return;

  const subject = `[Syncro Gatekeeper] New ${type} Pending Approval: ${title}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 20px;">🛡️ Syncro Gatekeeper Alert</h2>
      </div>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        A new <strong>${type}</strong> request requires your Super-Admin review and approval.
      </p>
      <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 4px 0; color: #0f172a; font-weight: 600;">Request: ${title}</p>
        ${Object.entries(details)
          .map(([k, v]) => `<p style="margin: 2px 0; color: #64748b; font-size: 13px;"><strong>${k}:</strong> ${v}</p>`)
          .join('')}
      </div>
      <div style="margin-top: 24px;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/gatekeeper" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Review in Super-Admin Portal &rarr;
        </a>
      </div>
    </div>
  `;

  try {
    await sendEmail({ to: superAdminEmail, subject, html }).catch(() => {});
  } catch (err) {
    console.error('[notifySuperAdminOfPendingRequest] Email failed:', err.message);
  }
};

/**
 * Sends a welcome/approval email to the user when their account or workspace is approved.
 */
export const sendApprovalConfirmationEmail = async ({ to, userName, type, entityName }) => {
  const subject = `🎉 Your Syncro ${type} is Approved!`;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 20px;">🚀 You're In! Welcome to Syncro</h2>
      </div>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Hi ${userName || 'there'},
      </p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Great news! Your <strong>${type}</strong> ${entityName ? `(<strong>${entityName}</strong>)` : ''} has been approved by the platform administrator.
      </p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        You now have full access to create projects, collaborate on real-time whiteboards, run sprints, and coordinate with your squad.
      </p>
      <div style="margin-top: 24px;">
        <a href="${clientUrl}/dashboard" style="display: inline-block; background: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Launch Syncro Dashboard &rarr;
        </a>
      </div>
    </div>
  `;

  try {
    await sendEmail({ to, subject, html }).catch(() => {});
  } catch (err) {
    console.error('[sendApprovalConfirmationEmail] Email failed:', err.message);
  }
};
