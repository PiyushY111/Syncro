import { prisma } from '../../config/prisma.js';

// 1. Get direct messages (parent messages only)
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

// 2. Clear Direct Messages
export const clearDirectMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;

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
