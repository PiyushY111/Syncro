import { prisma } from '../../../config/prisma.js';
import { verifyInvitationToken } from '../workspaceHelpers.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../utils/errors/appError.js';

export const acceptWorkspaceInvitation = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const currentEmail = req.user.email;
    const { token } = req.body;

    const invitation = verifyInvitationToken(token);

    if (!invitation) {
        throw new BadRequestError("Invitation link is invalid or has expired");
    }

    if (currentEmail && currentEmail.toLowerCase() !== invitation.email) {
        throw new ForbiddenError("Please sign in with the invited email address");
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: invitation.workspaceId },
        include: { members: true },
    });

    if (!workspace) {
        throw new NotFoundError("Workspace not found");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new NotFoundError('User not found');
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
});
