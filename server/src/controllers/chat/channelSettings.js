import { prisma } from '../../config/prisma.js';
import { getUserWorkspaceRole, hasWorkspacePermission } from '../role/checkPermissionHelper.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors/appError.js';

export const clearChannelChat = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { channelId } = req.params;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
        throw new NotFoundError("Channel not found");
    }

    const { role, isOwner } = await getUserWorkspaceRole(userId, channel.workspaceId);
    if (!role) {
        throw new ForbiddenError("Access restricted to workspace members only");
    }

    const isCreator = channel.creatorId === userId;
    const canManage = isOwner || role === 'ADMIN' || await hasWorkspacePermission(userId, channel.workspaceId, 'manageChannels');
    if (!isCreator && !canManage) {
        throw new ForbiddenError("Only channel creator or admins can clear chat history");
    }

    await prisma.message.deleteMany({
        where: { channelId }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.message.create({
        data: { content: `${user?.name || 'A user'} cleared the channel chat history`, userId, channelId, type: "SYSTEM" }
    });

    return res.json({ message: "Channel chat history cleared successfully" });
});

export const exportChannelChat = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { channelId } = req.params;

    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { members: { select: { id: true } } }
    });
    if (!channel) {
        throw new NotFoundError("Channel not found");
    }

    const { role, isOwner } = await getUserWorkspaceRole(userId, channel.workspaceId);
    if (!role) {
        throw new ForbiddenError("Access restricted to workspace members only");
    }

    if (channel.isPrivate && !isOwner && role !== 'ADMIN' && channel.creatorId !== userId) {
        const isMember = channel.members.some(m => m.id === userId);
        if (!isMember) {
            throw new ForbiddenError("Access denied to private channel");
        }
    }

    const messages = await prisma.message.findMany({
        where: { channelId },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" }
    });

    let transcript = `=========================================\nSYNCRO CHAT EXPORT - #${channel.name.toUpperCase()}\nExported Date: ${new Date().toLocaleString()}\n=========================================\n\n`;

    messages.forEach(m => {
        const time = new Date(m.createdAt).toLocaleString();
        const sender = m.user?.name || "System";
        transcript += `[${time}] ${sender}: ${m.content}\n`;
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${channel.name}-chat-export.txt"`);
    return res.send(transcript);
});

export const toggleStarMessage = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { messageId } = req.params;
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
        throw new NotFoundError("Message not found");
    }

    if (message.channelId) {
        const channel = await prisma.channel.findUnique({
            where: { id: message.channelId },
            include: { members: { select: { id: true } } }
        });
        if (!channel) {
            throw new NotFoundError("Channel not found");
        }

        const { role, isOwner } = await getUserWorkspaceRole(userId, channel.workspaceId);
        if (!role) {
            throw new ForbiddenError("Access restricted to workspace members only");
        }

        if (channel.isPrivate && !isOwner && role !== 'ADMIN' && channel.creatorId !== userId) {
            const isMember = channel.members.some(m => m.id === userId);
            if (!isMember) {
                throw new ForbiddenError("Access denied to private channel");
            }
        }
    } else {
        if (message.userId !== userId && message.recipientId !== userId) {
            throw new ForbiddenError("Access denied");
        }
    }

    const updated = await prisma.message.update({
        where: { id: messageId },
        data: { isStarred: !message.isStarred }
    });

    return res.json({ message: updated, isStarred: updated.isStarred });
});

export const getStarredMessages = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { channelId } = req.params;

    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { members: { select: { id: true } } }
    });
    if (!channel) {
        throw new NotFoundError("Channel not found");
    }

    const { role, isOwner } = await getUserWorkspaceRole(userId, channel.workspaceId);
    if (!role) {
        throw new ForbiddenError("Access restricted to workspace members only");
    }

    if (channel.isPrivate && !isOwner && role !== 'ADMIN' && channel.creatorId !== userId) {
        const isMember = channel.members.some(m => m.id === userId);
        if (!isMember) {
            throw new ForbiddenError("Access denied to private channel");
        }
    }

    const messages = await prisma.message.findMany({
        where: { channelId, isStarred: true },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" }
    });

    return res.json({ messages });
});

