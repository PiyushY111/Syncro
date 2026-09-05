import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getProjectSprints = asyncHandler(async (req, res) => {
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
});
