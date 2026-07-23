import { prisma } from '../../config/prisma.js';
import sendEmail from '../../config/nodemailer.js';
import { createInvitationToken, verifyInvitationToken, getInviteTokenTtlMs } from './workspaceHelpers.js';

export const sendWorkspaceInvitationEmail = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, workspaceId, role } = req.body;
        
        let normalizedRole = 'MEMBER';
        if (role === 'org:owner') normalizedRole = 'OWNER';
        else if (role === 'org:admin') normalizedRole = 'ADMIN';
        else if (role === 'org:manager') normalizedRole = 'MANAGER';
        else if (role === 'org:member') normalizedRole = 'MEMBER';
        else if (['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'].includes(role)) normalizedRole = role;

        if (!email || !workspaceId) {
            return res.status(400).json({ message: "Email and workspace ID are required" });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                members: true,
                owner: true,
            },
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const inviterUser = await prisma.user.findUnique({ where: { id: userId } });
        
        const userMember = workspace.members.find((member) => member.userId === userId);
        const userRole = userMember?.role || (workspace.ownerId === userId ? 'OWNER' : 'MEMBER');

        const canInvite = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);
        if (!canInvite) {
            return res.status(403).json({ message: "You do not have permission to invite members to this workspace" });
        }

        const roleHierarchy = { 'OWNER': 4, 'ADMIN': 3, 'MANAGER': 2, 'MEMBER': 1 };
        if (roleHierarchy[normalizedRole] > roleHierarchy[userRole]) {
            return res.status(403).json({ message: "You cannot invite someone with a higher role than yourself" });
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
                <p style="margin: 0; color: #6b7280; font-size: 14px;">If the link does not open, visit ${workspaceUrl} and sign in with this email address.</p>
            </div>
        `;

        await sendEmail(email, subject, text, html);

        return res.json({ message: "Invitation email sent successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

export const acceptWorkspaceInvitation = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentEmail = req.user.email;
        const { token } = req.body;

        const invitation = verifyInvitationToken(token);

        if (!invitation) {
            return res.status(400).json({ message: "Invitation link is invalid or has expired" });
        }

        if (currentEmail && currentEmail.toLowerCase() !== invitation.email) {
            return res.status(403).json({ message: "Please sign in with the invited email address" });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: invitation.workspaceId },
            include: { members: true },
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const existingMember = workspace.members.find((member) => member.userId === user.id);

        if (existingMember) {
            return res.json({ message: "You are already a member of this workspace", workspaceId: workspace.id });
        }

        await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId: workspace.id,
                role: invitation.role,
                message: `${user.name} joined the workspace ${workspace.name} through an invitation`,
            },
        });

        return res.json({ message: "Invitation accepted successfully", workspaceId: workspace.id });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};
