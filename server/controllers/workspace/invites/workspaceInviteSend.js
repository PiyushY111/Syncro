import { prisma } from '../../../config/prisma.js';
import { eventBus } from '../../../services/eventBus.js';
import { createInvitationToken, getInviteTokenTtlMs } from '../workspaceHelpers.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../utils/errors/appError.js';

export const sendWorkspaceInvitationEmail = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { email, workspaceId, role } = req.body;
    
    let normalizedRole = 'MEMBER';
    if (role === 'org:owner') normalizedRole = 'OWNER';
    else if (role === 'org:admin') normalizedRole = 'ADMIN';
    else if (role === 'org:manager') normalizedRole = 'MANAGER';
    else if (role === 'org:member') normalizedRole = 'MEMBER';
    else if (['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'].includes(role)) normalizedRole = role;

    if (!email || !workspaceId) {
        throw new BadRequestError("Email and workspace ID are required");
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { members: true, owner: true },
    });

    if (!workspace) {
        throw new NotFoundError("Workspace not found");
    }

    const inviterUser = await prisma.user.findUnique({ where: { id: userId } });
    
    const userMember = workspace.members.find((member) => member.userId === userId);
    const userRole = userMember?.role || (workspace.ownerId === userId ? 'OWNER' : 'MEMBER');

    const canInvite = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);
    if (!canInvite) {
        throw new ForbiddenError("You do not have permission to invite members to this workspace");
    }

    const roleHierarchy = { 'OWNER': 4, 'ADMIN': 3, 'MANAGER': 2, 'MEMBER': 1 };
    if (roleHierarchy[normalizedRole] > roleHierarchy[userRole]) {
        throw new ForbiddenError("You cannot invite someone with a higher role than yourself");
    }

    const inviter = inviterUser?.name || inviterUser?.email || "A workspace admin";
    const rawClientUrl = process.env.CLIENT_URL || req.get('origin') || 'http://localhost:5173';
    const workspaceUrl = rawClientUrl.split(',')[0].trim();
    const token = createInvitationToken({
        email: email.toLowerCase(),
        workspaceId,
        role: normalizedRole,
        issuedAt: Date.now(),
        expiresAt: Date.now() + getInviteTokenTtlMs(),
    });
    const acceptLink = `${workspaceUrl.replace(/\/$/, '')}/accept-invite?token=${encodeURIComponent(token)}`;
    const subject = `Invitation to join ${workspace.name}`;
    const text = `${inviter} invited you to join the workspace ${workspace.name} as ${normalizedRole.toLowerCase()}. Open the link below to continue: ${acceptLink}`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <h2 style="margin: 0 0 12px;">You're invited to join ${workspace.name}</h2>
            <p style="margin: 0 0 12px;">${inviter} invited you to join this workspace as <strong>${normalizedRole.toLowerCase()}</strong>.</p>
            <p style="margin: 0 0 20px;">Click the button below to accept the invitation.</p>
            <p style="margin: 0 0 20px;">
                <a href="${acceptLink}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">Accept Invite</a>
            </p>
            <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">If the button does not work, use this link:</p>
            <p style="margin: 0 0 16px;"><a href="${acceptLink}" style="color: #2563eb; word-break: break-word;">${acceptLink}</a></p>
        </div>
    `;

    await eventBus.publish('app/workspace.member_invited', {
        email: email.toLowerCase(),
        subject,
        text,
        html,
        workspaceId,
        role: normalizedRole,
        auditContext: {
            workspaceId,
            userId,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.json({ message: "Invitation email sent successfully" });
});
