import { prisma } from '../../../config/prisma.js';

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
