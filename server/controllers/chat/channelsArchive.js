import { prisma } from '../../config/prisma.js';

// Archive / Unarchive Channel
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
