import { prisma } from '../../../config/prisma.js';

// 1. Join public (or private) channel
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

        const isUserInWorkspace = channel.workspace.members.some(m => m.userId === userId) || channel.workspace.ownerId === userId;
        if (!isUserInWorkspace) {
            return res.status(403).json({ message: "You are not a member of this workspace" });
        }

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

// 2. Add organization teammate to channel explicitly
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
