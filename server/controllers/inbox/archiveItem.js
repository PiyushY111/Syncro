import { prisma } from "../../config/prisma.js";
import { redisCache } from "../../config/redis.js";

export const archiveNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        if (id.startsWith("task-dyn-") || id.startsWith("meeting-dyn-")) {
            return res.status(200).json({ message: "Dynamic item archived" });
        }

        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isArchived: true }
        });

        try {
            await redisCache.incr(`inbox:version:${userId}`);
        } catch {}

        return res.status(200).json({ notification: updated });
    } catch (error) {
        console.error("Error archiving notification:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
