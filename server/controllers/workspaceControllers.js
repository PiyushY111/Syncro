import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import sendEmail from '../config/nodemailer.js';

const inviteSecret = process.env.JWT_SECRET || 'development-secret';
const inviteTokenTtlMs = Number(process.env.INVITE_TTL_MS || 1000 * 60 * 60 * 24 * 7);

const base64UrlEncode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

const signInviteToken = (payload) => crypto.createHmac('sha256', inviteSecret).update(payload).digest('base64url');

const createInvitationToken = (payload) => {
    const encodedPayload = base64UrlEncode(payload);
    const signature = signInviteToken(encodedPayload);
    return `${encodedPayload}.${signature}`;
};

const verifyInvitationToken = (token) => {
    if (!token) return null;

    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature) return null;

    const expectedSignature = signInviteToken(encodedPayload);

    if (expectedSignature.length !== signature.length) return null;

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;

    try {
        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));

        if (payload.expiresAt && Date.now() > payload.expiresAt) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
};

const createWorkspaceSlug = (name) =>
    `${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${crypto.randomBytes(4).toString('hex')}`;

export const createWorkspace = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description = '', image_url = '' } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ message: 'Workspace name is required' });
        }

        const workspace = await prisma.workspace.create({
            data: {
                name: name.trim(),
                slug: createWorkspaceSlug(name),
                description: description.trim() || null,
                ownerId: userId,
                image_url: image_url.trim(),
                members: {
                    create: {
                        userId,
                        role: 'OWNER',
                    },
                },
            },
            include: {
                owner: true,
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } },
                        members: { include: { user: true } },
                    },
                },
            },
        });

        return res.status(201).json({ workspace, message: 'Workspace created successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

export const getUserWorkspaces = async (req, res) => {
    try {
        const userId = req.user.id;
        const workspaceMemberships = await prisma.workspaceMember.findMany({
            where: {
                userId: userId,
            },
            include: {
                workspace: {
                    include: {
                        members: { include: { user: true } },
                        projects: {
                            include: {
                                tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } },
                                members: { include: { user: true } }
                            }
                        },
                        owner: true,
                    }
                }
            }
        });

        const workspaces = workspaceMemberships.map((membership) => membership.workspace);
        res.json({ workspaces });


    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: err.code || err.message });
    }
}

// Add member to workspace
export const addMember = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, role, workspaceId } = req.body;
        const normalizedRole = role === 'org:admin' ? 'ADMIN' : 'MEMBER';

        const invitedUser = await prisma.user.findUnique({ where: { email: email?.toLowerCase() } });

        if (!invitedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!workspaceId || !role) {
            return res.status(400).json({ message: "Workspace ID and role are required" });
        }

        if (!['ADMIN', 'MEMBER'].includes(normalizedRole)) {
            return res.status(400).json({ message: "Invalid role. Must be 'ADMIN' or 'MEMBER'" });
        }

        //Fetch Workspace
        const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, include: { members: true } });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const isAdmin = workspace.members.some((member) => member.userId === userId && member.role === 'ADMIN') || workspace.ownerId === userId;

        if (!isAdmin) {
            return res.status(401).json({ message: "Only Admins can add members to the workspace" });
        }

        // check if the user is already a member of the workspace
        const existingMember = workspace.members.find((member) => member.userId === invitedUser.id);

        if (existingMember) {
            return res.json({ member: existingMember, message: "User is already a member of the workspace" });
        }

        const member = await prisma.workspaceMember.create({
            data: {
                userId: invitedUser.id,
                workspaceId: workspaceId,
                role: normalizedRole,
                message: `${invitedUser.name} has been added as a ${normalizedRole.toLowerCase()} to the workspace ${workspace.name}`
            }
        })
        res.json({ member, message: "Member added successfully" });
    }

    catch (err) {
        console.error(err);
        res.status(500).json({ message: err.code || err.message });
    }
}

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
        const workspaceUrl = process.env.CLIENT_URL || req.get('origin') || 'https://projectworkspacemanagement.vercel.app' || 'http://localhost:5173';
        const token = createInvitationToken({
            email: email.toLowerCase(),
            workspaceId,
            role: normalizedRole,
            issuedAt: Date.now(),
            expiresAt: Date.now() + inviteTokenTtlMs,
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
        res.status(500).json({ message: err.code || err.message });
    }
}

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
        res.status(500).json({ message: err.code || err.message });
    }
};

export const updateWorkspace = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, description, image_url } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ message: 'Workspace name is required' });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id },
            include: { members: true }
        });

        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const userMember = workspace.members.find(m => m.userId === userId);
        const userRole = userMember?.role || (workspace.ownerId === userId ? 'OWNER' : 'MEMBER');
        const isAuthorized = ['OWNER', 'ADMIN'].includes(userRole);
        
        if (!isAuthorized) {
            return res.status(403).json({ message: 'Only Admins or the Owner can update workspace settings' });
        }

        const updatedWorkspace = await prisma.workspace.update({
            where: { id },
            data: {
                name: name.trim(),
                slug: createWorkspaceSlug(name),
                description: description ? description.trim() : null,
                image_url: image_url !== undefined ? image_url.trim() : "",
            },

            include: {
                owner: true,
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } },
                        members: { include: { user: true } },
                    },
                },
            },
        });

        return res.json({ workspace: updatedWorkspace, message: 'Workspace updated successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

export const deleteWorkspace = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const workspace = await prisma.workspace.findUnique({
            where: { id }
        });

        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        if (workspace.ownerId !== userId) {
            return res.status(403).json({ message: 'Only the Workspace Owner can delete this workspace' });
        }

        await prisma.workspace.delete({
            where: { id }
        });

        return res.json({ id, message: 'Workspace deleted successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

export const updateMemberRole = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id: workspaceId, memberId } = req.params;
        const { role } = req.body;

        if (!['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true },
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const userMember = workspace.members.find((member) => member.userId === userId);
        const userRole = userMember?.role || (workspace.ownerId === userId ? 'OWNER' : 'MEMBER');

        const targetMember = workspace.members.find((member) => member.id === memberId);
        if (!targetMember) {
            return res.status(404).json({ message: "Member not found in this workspace" });
        }

        const roleHierarchy = { 'OWNER': 4, 'ADMIN': 3, 'MANAGER': 2, 'MEMBER': 1 };
        
        const canUpdate = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);
        if (!canUpdate) {
            return res.status(403).json({ message: "You do not have permission to manage member roles" });
        }

        if (roleHierarchy[targetMember.role] >= roleHierarchy[userRole] && targetMember.userId !== userId) {
            return res.status(403).json({ message: "You cannot change the role of a user with a higher or equal role" });
        }

        if (roleHierarchy[role] > roleHierarchy[userRole]) {
            return res.status(403).json({ message: "You cannot promote a member to a role higher than your own" });
        }

        if (targetMember.role === 'OWNER' && role !== 'OWNER') {
            if (workspace.ownerId === targetMember.userId) {
                return res.status(403).json({ message: "Cannot demote the primary Workspace Owner" });
            }
        }

        await prisma.workspaceMember.update({
            where: { id: memberId },
            data: { role },
        });

        const updatedWorkspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                owner: true,
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } },
                        members: { include: { user: true } },
                    },
                },
            },
        });

        return res.json({ workspace: updatedWorkspace, message: "Member role updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

export const removeMember = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id: workspaceId, memberId } = req.params;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true },
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const userMember = workspace.members.find((member) => member.userId === userId);
        const userRole = userMember?.role || (workspace.ownerId === userId ? 'OWNER' : 'MEMBER');

        const targetMember = workspace.members.find((member) => member.id === memberId);
        if (!targetMember) {
            return res.status(404).json({ message: "Member not found in this workspace" });
        }

        if (workspace.ownerId === targetMember.userId) {
            return res.status(403).json({ message: "Cannot remove the primary Workspace Owner" });
        }

        const roleHierarchy = { 'OWNER': 4, 'ADMIN': 3, 'MANAGER': 2, 'MEMBER': 1 };

        const isSelf = targetMember.userId === userId;
        const canRemove = isSelf || ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);

        if (!canRemove) {
            return res.status(403).json({ message: "You do not have permission to remove members from this workspace" });
        }

        if (!isSelf && roleHierarchy[targetMember.role] >= roleHierarchy[userRole]) {
            return res.status(403).json({ message: "You cannot remove a user with a higher or equal role" });
        }

        await prisma.workspaceMember.delete({
            where: { id: memberId },
        });

        const updatedWorkspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                owner: true,
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } },
                        members: { include: { user: true } },
                    },
                },
            },
        });

        return res.json({ workspace: updatedWorkspace, message: "Member removed successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};