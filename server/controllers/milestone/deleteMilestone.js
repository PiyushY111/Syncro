import { prisma } from "../../config/prisma.js";

export const deleteMilestone = async (req, res) => {
    try {
        const { id } = req.params;

        const milestone = await prisma.milestone.findUnique({
            where: { id }
        });

        if (!milestone) {
            return res.status(404).json({ message: "Milestone not found" });
        }

        // Unlink tasks before deleting
        await prisma.task.updateMany({
            where: { milestoneId: id },
            data: { milestoneId: null }
        });

        await prisma.milestone.delete({
            where: { id }
        });

        return res.status(200).json({ message: "Milestone deleted successfully" });
    } catch (error) {
        console.error("Error deleting milestone:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
