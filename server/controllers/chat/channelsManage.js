import { prisma } from '../../config/prisma.js';
import { hasWorkspacePermission } from '../role/checkPermissionHelper.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors/appError.js';

const canManageChannel = async (channel, userId) => {
    if (!channel) return false;
    if (channel.creatorId === userId) return true;

    return await hasWorkspacePermission(userId, channel.workspaceId, 'manageChannels');
};

export const updateChannelDetails = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { channelId } = req.params;
    const { name, description, iconUrl } = req.body;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
        throw new NotFoundError("Channel not found");
    }

    if (!(await canManageChannel(channel, userId))) {
        throw new ForbiddenError("You do not have permission to update channel details");
    }

    const updated = await prisma.channel.update({
        where: { id: channelId },
        data: {
            name: name ? name.trim().toLowerCase().replace(/\s+/g, "-") : channel.name,
            description: description !== undefined ? description : channel.description,
            iconUrl: iconUrl !== undefined ? iconUrl : channel.iconUrl
        }
    });

    return res.json({ channel: updated, message: "Channel details updated" });
});

export const archiveChannel = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { channelId } = req.params;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
        throw new NotFoundError("Channel not found");
    }

    if (!(await canManageChannel(channel, userId))) {
        throw new ForbiddenError("Only admins can archive channels");
    }

    const updated = await prisma.channel.update({
        where: { id: channelId },
        data: { isArchived: true }
    });

    return res.json({ channel: updated, message: "Channel archived" });
});

export const deleteChannel = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { channelId } = req.params;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
        throw new NotFoundError("Channel not found");
    }

    if (!(await canManageChannel(channel, userId))) {
        throw new ForbiddenError("Only admins can delete channels");
    }

    await prisma.channel.delete({ where: { id: channelId } });
    return res.json({ message: "Channel deleted successfully" });
});

