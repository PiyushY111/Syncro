import { prisma } from '../config/prisma.js';

// 1. Create a group channel
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

        // Create initial system message: "Creator created the channel"
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

// 2. Fetch workspace channels
export const getWorkspaceChannels = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId } = req.params;

        // Fetch workspace to check owner
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { ownerId: true }
        });
        const isWorkspaceOwner = workspace?.ownerId === userId;

        const channels = await prisma.channel.findMany({
            where: {
                workspaceId,
                OR: isWorkspaceOwner ? [
                    {} // Workspace owner can see all public & private channels
                ] : [
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

// 3. Send message (Channel, DM, or Thread Reply)
export const sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, channelId, recipientId, parentId } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Message content cannot be empty" });
        }

        if (channelId) {
            const channel = await prisma.channel.findUnique({
                where: { id: channelId },
                include: {
                    members: { select: { id: true } },
                    workspace: { select: { ownerId: true } }
                }
            });
            if (channel?.isArchived) {
                return res.status(400).json({ message: "Cannot send messages to an archived channel" });
            }
            // Member verification
            const isMember = channel?.members.some(m => m.id === userId) || channel?.creatorId === userId;
            const isWorkspaceOwner = channel?.workspace?.ownerId === userId;
            if (!isMember && !isWorkspaceOwner) {
                return res.status(403).json({ message: "You must join this channel to send messages" });
            }
        }

        const message = await prisma.message.create({
            data: {
                content: content.trim(),
                userId,
                channelId,
                recipientId,
                parentId,
                type: "TEXT"
            },
            include: {
                user: true
            }
        });

        return res.status(201).json({ message });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

// 4. Get channel messages (parent messages only)
export const getChannelMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;

        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: {
                members: { select: { id: true } },
                workspace: { select: { ownerId: true } }
            }
        });

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        const isMember = channel.members.some(m => m.id === userId) || channel.creatorId === userId;
        const isWorkspaceOwner = channel.workspace?.ownerId === userId;

        if (!isMember && !isWorkspaceOwner) {
            return res.status(403).json({ message: "You must join this channel to view its message history", isNotMember: true });
        }

        const messages = await prisma.message.findMany({
            where: {
                channelId,
                parentId: null
            },
            include: {
                user: true,
                _count: {
                    select: { replies: true }
                }
            },
            orderBy: { createdAt: "asc" }
        });
        return res.json({ messages });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

// 5. Get direct messages (parent messages only)
export const getDirectMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;
        const messages = await prisma.message.findMany({
            where: {
                parentId: null,
                OR: [
                    { userId: userId, recipientId: otherUserId },
                    { userId: otherUserId, recipientId: userId }
                ]
            },
            include: {
                user: true,
                _count: {
                    select: { replies: true }
                }
            },
            orderBy: { createdAt: "asc" }
        });
        return res.json({ messages });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

// 6. Get thread replies
export const getThreadReplies = async (req, res) => {
    try {
        const { messageId } = req.params;
        const replies = await prisma.message.findMany({
            where: { parentId: messageId },
            include: { user: true },
            orderBy: { createdAt: "asc" }
        });
        return res.json({ replies });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

// 7. Archive / Unarchive Channel
export const archiveChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const channel = await prisma.channel.findUnique({
            where: { id: channelId }
        });

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        const updatedChannel = await prisma.channel.update({
            where: { id: channelId },
            data: { isArchived: !channel.isArchived }
        });

        return res.json({ 
            channel: updatedChannel, 
            message: updatedChannel.isArchived ? "Channel archived successfully" : "Channel unarchived successfully" 
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

// 8. Delete Channel
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

// 9. Clear Direct Messages
export const clearDirectMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId, otherUserId } = req.params;

        await prisma.message.deleteMany({
            where: {
                OR: [
                    { userId: userId, recipientId: otherUserId },
                    { userId: otherUserId, recipientId: userId }
                ]
            }
        });

        return res.json({ message: "Direct message history cleared successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

// 10. Join public (or private) channel
export const joinChannel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;

        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: {
                members: { select: { id: true } },
                workspace: { include: { members: true } }
            }
        });

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        // Check if user is in workspace
        const isUserInWorkspace = channel.workspace.members.some(m => m.userId === userId) || channel.workspace.ownerId === userId;
        if (!isUserInWorkspace) {
            return res.status(403).json({ message: "You are not a member of this workspace" });
        }

        // Connect user to members list if not already present
        const isAlreadyMember = channel.members.some(m => m.id === userId) || channel.creatorId === userId;
        if (!isAlreadyMember) {
            await prisma.channel.update({
                where: { id: channelId },
                data: {
                    members: {
                        connect: { id: userId }
                    }
                }
            });

            // Send system message
            const user = await prisma.user.findUnique({ where: { id: userId } });
            await prisma.message.create({
                data: {
                    content: `${user.name} has joined the channel`,
                    userId,
                    channelId,
                    type: "SYSTEM"
                }
            });
        }

        return res.json({ message: "Joined channel successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

// 11. Add organization teammate to channel explicitly
export const addMemberToChannel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;
        const { memberId } = req.body;

        if (!memberId) {
            return res.status(400).json({ message: "Member ID is required" });
        }

        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: {
                workspace: true,
                members: { select: { id: true } }
            }
        });

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        // Verify caller permission (is channel member or workspace owner)
        const isCallerMember = channel.members.some(m => m.id === userId) || channel.creatorId === userId;
        const isWorkspaceOwner = channel.workspace.ownerId === userId;
        if (!isCallerMember && !isWorkspaceOwner) {
            return res.status(403).json({ message: "Only channel members or workspace owners can add others" });
        }

        const isAlreadyMember = channel.members.some(m => m.id === memberId);
        if (!isAlreadyMember) {
            await prisma.channel.update({
                where: { id: channelId },
                data: {
                    members: {
                        connect: { id: memberId }
                    }
                }
            });

            // Send system message
            const addedUser = await prisma.user.findUnique({ where: { id: memberId } });
            await prisma.message.create({
                data: {
                    content: `${addedUser.name} was added to the channel`,
                    userId: memberId,
                    channelId,
                    type: "SYSTEM"
                }
            });
        }

        return res.json({ message: "Member added successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

// 12. Update Channel Details
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

        // Only channel creator or workspace owner can edit details
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
