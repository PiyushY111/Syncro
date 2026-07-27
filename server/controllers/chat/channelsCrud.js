import { prisma } from '../../config/prisma.js';
import { hasWorkspacePermission, getUserWorkspaceRole } from '../role/checkPermissionHelper.js';

export const createChannel = async (req, res) => {
    try {
        const { name, description, iconUrl, workspaceId, isPrivate } = req.body;
        const userId = req.user.id;
        if (!name || !workspaceId) return res.status(400).json({ message: "Name and Workspace ID are required" });

        const canManage = await hasWorkspacePermission(userId, workspaceId, 'manageChannels');
        if (!canManage) {
            return res.status(403).json({ message: "You do not have permission to create channels in this workspace" });
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
                content: `${creator.name} created the channel`,
                userId,
                channelId: channel.id,
                type: "SYSTEM"
            }
        });

        return res.status(201).json({ channel, message: "Channel created successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const getWorkspaceChannels = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId } = req.params;

        const { role, isOwner, workspace } = await getUserWorkspaceRole(userId, workspaceId);
        if (!workspace || !role) {
            return res.status(403).json({ message: "Access restricted to workspace members only" });
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

        return res.json({ channels });
    } catch (err) {
        console.error("[GET CHANNELS ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};

export const browsePublicChannels = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId } = req.params;
        const { search = "" } = req.query;

        const { role } = await getUserWorkspaceRole(userId, workspaceId);
        if (!role) {
            return res.status(403).json({ message: "Access restricted to workspace members only" });
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
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const joinPublicChannel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;

        const channel = await prisma.channel.findUnique({ where: { id: channelId } });
        if (!channel) return res.status(404).json({ message: "Channel not found" });
        if (channel.isPrivate) return res.status(403).json({ message: "Cannot join a private channel without invitation" });

        const { role } = await getUserWorkspaceRole(userId, channel.workspaceId);
        if (!role) {
            return res.status(403).json({ message: "Cannot join a channel in a workspace you are not a member of" });
        }

        const updated = await prisma.channel.update({
            where: { id: channelId },
            data: { members: { connect: { id: userId } } },
            include: { members: { select: { id: true, name: true, image: true } } }
        });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        await prisma.message.create({
            data: { content: `${user.name} joined the channel`, userId, channelId, type: "SYSTEM" }
        });

        return res.json({ channel: updated, message: "Joined channel successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const toggleStarChannel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;

        const channel = await prisma.channel.findUnique({ where: { id: channelId } });
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { starredChannelIds: true }
        });

        if (!user) return res.status(404).json({ message: "User not found" });

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
    } catch (err) {
        console.error("[TOGGLE STAR CHANNEL ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};
