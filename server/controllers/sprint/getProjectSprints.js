import { prisma } from "../../config/prisma.js";

export const getProjectSprints = async (req, res) => {
    try {
        const { projectId } = req.params;

        const sprints = await prisma.sprint.findMany({
            where: { projectId },
            include: {
                capacities: {
                    include: { user: true }
                },
                tasks: {
                    include: { assignee: true }
                }
            },
            orderBy: { createdAt: "asc" }
        });

        return res.status(200).json({ sprints });
    } catch (error) {
        console.error("Error fetching project sprints:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
