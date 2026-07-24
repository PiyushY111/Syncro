import { prisma } from "../../config/prisma.js";

export const handleInboxAction = async (req, res) => {
    try {
        const userId = req.user.id;
        const { actionType, entityType, entityId, status } = req.body;

        if (entityType === "MEETING" && actionType === "RESPOND_INVITE") {
            await prisma.meetingInvite.updateMany({
                where: { meetingId: entityId, userId },
                data: { status: status || "ACCEPTED" }
            });
            return res.status(200).json({ message: `Meeting invitation ${status?.toLowerCase() || 'accepted'}` });
        }

        if (entityType === "TASK" && actionType === "COMPLETE_TASK") {
            await prisma.task.update({
                where: { id: entityId },
                data: { status: "DONE" }
            });
            return res.status(200).json({ message: "Task marked as completed" });
        }

        return res.status(400).json({ message: "Invalid inbox action parameters" });
    } catch (error) {
        console.error("Error executing inbox action:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
