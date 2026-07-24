import { prisma } from '../../config/prisma.js';

export const createChannel = async (req, res) => {
    try {
        const { name, description, iconUrl, workspaceId, isPrivate } = req.body;
        const userId = req.user.id;
        if (!name || !workspaceId) return res.status(400).json({ message: "Name and Workspace ID are required" });

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

        const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { ownerId: true } });
        const isOwner = workspace?.ownerId === userId;

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
