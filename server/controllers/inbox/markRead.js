import { prisma } from "../../config/prisma.js";

export const markNotificationRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        if (id.startsWith("task-dyn-") || id.startsWith("meeting-dyn-")) {
            return res.status(200).json({ message: "Dynamic item updated" });
        }

        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: !notification.isRead }
        });

        return res.status(200).json({ notification: updated });
    } catch (error) {
        console.error("Error marking notification read:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const markAllNotificationsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        return res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Error marking all notifications read:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
