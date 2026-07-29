import { prisma } from "../../config/prisma.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";

const canManageSprints = async (userId, workspaceId) => {
    return await hasWorkspacePermission(userId, workspaceId, "editTasks");
};

export const updateCapacity = async (req, res) => {
    try {
        const { sprintId } = req.params;
        const { userId, capacity } = req.body;

        if (!userId || capacity === undefined) {
            return res.status(400).json({ message: "userId and capacity are required" });
        }

        const sprint = await prisma.sprint.findUnique({
            where: { id: sprintId },
            include: { project: true }
        });

        if (!sprint) return res.status(404).json({ message: "Sprint not found" });

        const hasPermission = await canManageSprints(req.user.id, sprint.project.workspaceId);
        if (!hasPermission) return res.status(403).json({ message: "You do not have permission to manage capacity" });

        const sprintCapacity = await prisma.sprintCapacity.upsert({
            where: { sprintId_userId: { sprintId, userId } },
            update: { capacity: parseInt(capacity, 10) },
            create: { sprintId, userId, capacity: parseInt(capacity, 10) },
            include: { user: true }
        });

        return res.status(200).json({ message: "Capacity updated successfully", capacity: sprintCapacity });
    } catch (error) {
        console.error("Error updating capacity:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
