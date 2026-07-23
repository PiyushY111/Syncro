import { prisma } from '../../config/prisma.js';

export const createChannel = async (req, res) => {
    try {
        const { name, description, workspaceId, isPrivate } = req.body;
        const userId = req.user.id;
        if (!name || !workspaceId) {
            return res.status(400).json({ message: "Name and Workspace ID are required" });
        }

        const channel = await prisma.channel.create({
            data: {
                name: name.trim().toLowerCase().replace(/\s+/g, "-"),
                description,
                workspaceId,
                isPrivate: Boolean(isPrivate),
                creatorId: userId,
                members: {
                    connect: { id: userId }
                }
            },
            include: {
                members: { select: { id: true, name: true } }
            }
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
        return res.status(500).json({ message: err.code || err.message });
    }
};

export const getWorkspaceChannels = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId } = req.params;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { ownerId: true }
        });
        const isWorkspaceOwner = workspace?.ownerId === userId;

        const channels = await prisma.channel.findMany({
            where: {
                workspaceId,
                OR: isWorkspaceOwner ? [{}] : [
                    { isPrivate: false },
                    { members: { some: { id: userId } } },
                    { creatorId: userId }
                ]
            },
            include: {
                members: { select: { id: true, name: true, image: true } }
            },
            orderBy: { name: "asc" }
        });
        return res.json({ channels });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

export const updateChannel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;
        const { name, description } = req.body;

        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: { workspace: true }
        });

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        const isCreator = channel.creatorId === userId;
        const isWorkspaceOwner = channel.workspace.ownerId === userId;

        if (!isCreator && !isWorkspaceOwner) {
            return res.status(403).json({ message: "Only the channel creator or workspace owner can edit details" });
        }

        const updated = await prisma.channel.update({
            where: { id: channelId },
            data: {
                name: name ? name.trim().toLowerCase().replace(/\s+/g, "-") : channel.name,
                description: description !== undefined ? description.trim() : channel.description
            }
        });

        return res.json({ channel: updated, message: "Channel details updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

export const deleteChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const channel = await prisma.channel.findUnique({
            where: { id: channelId }
        });

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        await prisma.channel.delete({
            where: { id: channelId }
        });

        return res.json({ message: "Channel deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};
