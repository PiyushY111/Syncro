import { prisma } from '../../../config/prisma.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../../utils/errors/appError.js';

// Add member to workspace explicitly
export const addMember = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { email, role, workspaceId } = req.body;
    const normalizedRole = role === 'org:admin' ? 'ADMIN' : 'MEMBER';

    const invitedUser = await prisma.user.findUnique({ where: { email: email?.toLowerCase() } });

    if (!invitedUser) {
        throw new NotFoundError("User not found");
    }

    if (!workspaceId || !role) {
        throw new BadRequestError("Workspace ID and role are required");
    }

    if (!['ADMIN', 'MEMBER'].includes(normalizedRole)) {
        throw new BadRequestError("Invalid role. Must be 'ADMIN' or 'MEMBER'");
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, include: { members: true } });

    if (!workspace) {
        throw new NotFoundError("Workspace not found");
    }

    const isAdmin = workspace.members.some((member) => member.userId === userId && member.role === 'ADMIN') || workspace.ownerId === userId;

    if (!isAdmin) {
        throw new UnauthorizedError("Only Admins can add members to the workspace");
    }

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
    });
    return res.json({ member, message: "Member added successfully" });
});
