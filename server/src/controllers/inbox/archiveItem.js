import { prisma } from "../../config/prisma.js";
import { redisCache } from "../../config/redis.js";
import { NotFoundError } from "../../utils/errors/appError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const archiveNotification = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    if (id.startsWith("task-dyn-") || id.startsWith("meeting-dyn-")) {
        return res.status(200).json({ message: "Dynamic item archived" });
    }

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
        throw new NotFoundError("Notification not found");
    }

    const updated = await prisma.notification.update({
        where: { id },
        data: { isArchived: true }
    });

    try {
        await redisCache.incr(`inbox:version:${userId}`);
    } catch {}

    return res.status(200).json({ notification: updated });
});
