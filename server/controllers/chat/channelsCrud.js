import { prisma } from '../../config/prisma.js';
import { redisCache } from '../../config/redis.js';
import { hasWorkspacePermission, getUserWorkspaceRole } from '../role/checkPermissionHelper.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors/appError.js';
import logger from '../../utils/logger/logger.js';

export const createChannel = asyncHandler(async (req, res) => {
    const { name, description, iconUrl, workspaceId, isPrivate } = req.body;
    const userId = req.user.id;
    if (!name || !workspaceId) {
        throw new BadRequestError("Name and Workspace ID are required");
    }

    const canManage = await hasWorkspacePermission(userId, workspaceId, 'manageChannels');
    if (!canManage) {
        throw new ForbiddenError("You do not have permission to create channels in this workspace");
    }

    const channel = await prisma.channel.create({
        data: {
            name: name.trim().toLowerCase().replace(/\s+/g, "-"),
            description: description || "",
            iconUrl: iconUrl || null,
            workspaceId,
            isPrivate: Boolean(isPrivate),
            creatorId: userId,
            members: { connect: { id: userId } }
        },
        include: { members: { select: { id: true, name: true, image: true } } }
    });

    const creator = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.message.create({
        data: {
            content: `${creator?.name || 'A user'} created the channel`,
            userId,
            channelId: channel.id,
            type: "SYSTEM"
        }
    });

    await redisCache.del(`workspace:${workspaceId}:channels:${userId}`);
    if (global.io) {
        global.io.emit('channel:created', { channel });
    }

    return res.status(201).json({ channel, message: "Channel created successfully" });
});

export const getWorkspaceChannels = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { workspaceId } = req.params;

    const cacheKey = `workspace:${workspaceId}:channels:${userId}`;
    try {
        const cached = await redisCache.get(cacheKey);
        if (cached) {
            const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
            return res.json({ channels: parsed, fromCache: true });
        }
    } catch (cacheErr) {
        logger.warn('[GET CHANNELS CACHE READ WARN]', { error: cacheErr.message });
    }

    const { role, isOwner, workspace } = await getUserWorkspaceRole(userId, workspaceId);
    if (!workspace || !role) {
        throw new ForbiddenError("Access restricted to workspace members only");
    }

    const whereCondition = {
        workspaceId,
        isArchived: false
    };

    if (!isOwner) {
        whereCondition.OR = [
            { isPrivate: false },
            { members: { some: { id: userId } } },
            { creatorId: userId }
        ];
    }

    const channels = await prisma.channel.findMany({
        where: whereCondition,
        include: { members: { select: { id: true, name: true, image: true } } },
        orderBy: { name: "asc" }
    });

    try {
        await redisCache.set(cacheKey, JSON.stringify(channels), 120);
    } catch (cacheErr) {
        logger.warn('[GET CHANNELS CACHE SET WARN]', { error: cacheErr.message });
    }

    return res.json({ channels, fromCache: false });
});

export const browsePublicChannels = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { workspaceId } = req.params;
    const { search = "" } = req.query;

    const { role } = await getUserWorkspaceRole(userId, workspaceId);
    if (!role) {
        throw new ForbiddenError("Access restricted to workspace members only");
    }

    const channels = await prisma.channel.findMany({
        where: {
            workspaceId,
            isPrivate: false,
            isArchived: false,
            name: { contains: search, mode: "insensitive" }
        },
        include: {
            _count: { select: { members: true } },
            members: { select: { id: true } }
        },
        orderBy: { name: "asc" }
    });

    const formatted = channels.map(ch => ({
        ...ch,
        isJoined: ch.members.some(m => m.id === userId)
    }));

    return res.json({ channels: formatted });
});

export const joinPublicChannel = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { channelId } = req.params;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
        throw new NotFoundError("Channel not found");
    }
    if (channel.isPrivate) {
        throw new ForbiddenError("Cannot join a private channel without invitation");
    }

    const { role } = await getUserWorkspaceRole(userId, channel.workspaceId);
    if (!role) {
        throw new ForbiddenError("Cannot join a channel in a workspace you are not a member of");
    }

    const updated = await prisma.channel.update({
        where: { id: channelId },
        data: { members: { connect: { id: userId } } },
        include: { members: { select: { id: true, name: true, image: true } } }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.message.create({
        data: { content: `${user?.name || 'A user'} joined the channel`, userId, channelId, type: "SYSTEM" }
    });

    return res.json({ channel: updated, message: "Joined channel successfully" });
});

export const toggleStarChannel = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { channelId } = req.params;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
        throw new NotFoundError("Channel not found");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { starredChannelIds: true }
    });

    if (!user) {
        throw new NotFoundError("User not found");
    }

    let starredIds = user.starredChannelIds || [];
    const isStarred = starredIds.includes(channelId);

    if (isStarred) {
        starredIds = starredIds.filter(id => id !== channelId);
    } else {
        starredIds = [...starredIds, channelId];
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { starredChannelIds: starredIds },
        select: {
            id: true,
            email: true,
            name: true,
            image: true,
            googleCalendarSync: true,
            googleCalendarEmail: true,
            starredChannelIds: true,
            createdAt: true,
        }
    });

    return res.json({ 
        starredChannelIds: updatedUser.starredChannelIds, 
        isStarred: !isStarred, 
        message: !isStarred ? "Channel starred successfully" : "Channel unstarred successfully",
        user: updatedUser
    });
});

