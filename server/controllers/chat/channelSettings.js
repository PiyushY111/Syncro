import { prisma } from '../../config/prisma.js';

export const clearChannelChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { channelId } = req.params;

        const channel = await prisma.channel.findUnique({ where: { id: channelId } });
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        await prisma.message.deleteMany({
            where: { channelId }
        });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        await prisma.message.create({
            data: { content: `${user.name} cleared the channel chat history`, userId, channelId, type: "SYSTEM" }
        });

        return res.json({ message: "Channel chat history cleared successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const exportChannelChat = async (req, res) => {
    try {
        const { channelId } = req.params;

        const channel = await prisma.channel.findUnique({ where: { id: channelId } });
        if (!channel) return res.status(404).json({ message: "Channel not found" });

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
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const toggleStarMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return res.status(404).json({ message: "Message not found" });

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: { isStarred: !message.isStarred }
        });

        return res.json({ message: updated, isStarred: updated.isStarred });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

export const getStarredMessages = async (req, res) => {
    try {
        const { channelId } = req.params;
        const messages = await prisma.message.findMany({
            where: { channelId, isStarred: true },
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: "desc" }
        });

        return res.json({ messages });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};
