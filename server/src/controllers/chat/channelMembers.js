import { prisma } from '../../config/prisma.js';
import { getUserWorkspaceRole } from '../role/checkPermissionHelper.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors/appError.js';
import logger from '../../utils/logger/logger.js';

export const addMemberToChannel = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { channelId } = req.params;
    const { memberUserId } = req.body;

    if (!memberUserId) {
        throw new BadRequestError("memberUserId is required");
    }

    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { members: { select: { id: true } } }
    });

    if (!channel) {
        throw new NotFoundError("Channel not found");
    }

    const isMember = channel.members.some(m => m.id === userId) || channel.creatorId === userId;
    if (!isMember) {
        throw new ForbiddenError("You must be a channel member to invite others");
    }

    const targetUserRole = await getUserWorkspaceRole(memberUserId, channel.workspaceId);
    if (!targetUserRole.role) {
        throw new BadRequestError("User is not a member of this workspace and cannot be added to this channel");
    }

    const updated = await prisma.channel.update({
        where: { id: channelId },
        data: { members: { connect: { id: memberUserId } } },
        include: { members: { select: { id: true, name: true, email: true, image: true } } }
    });

    const addedUser = await prisma.user.findUnique({ where: { id: memberUserId } });
    const inviter = await prisma.user.findUnique({ where: { id: userId } });

    await prisma.message.create({
        data: { content: `${inviter?.name || 'A user'} added ${addedUser?.name || 'a member'} to the channel`, userId, channelId, type: "SYSTEM" }
    });

    return res.json({ channel: updated, message: "Member added to channel successfully" });
});

export const removeMemberFromChannel = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { channelId, memberUserId } = req.params;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
        throw new NotFoundError("Channel not found");
    }

    if (channel.creatorId !== userId && userId !== memberUserId) {
        throw new ForbiddenError("Only the channel creator can remove members");
    }

    const updated = await prisma.channel.update({
        where: { id: channelId },
        data: { members: { disconnect: { id: memberUserId } } },
        include: { members: { select: { id: true, name: true, email: true, image: true } } }
    });

    const removedUser = await prisma.user.findUnique({ where: { id: memberUserId } });
    await prisma.message.create({
        data: { content: `${removedUser?.name || 'A member'} left the channel`, userId: memberUserId, channelId, type: "SYSTEM" }
    });

    return res.json({ channel: updated, message: "Member removed from channel" });
});

