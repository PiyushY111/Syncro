import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../../utils/errors/appError.js";

export const linkTasksToMilestone = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { taskIds } = req.body; // Array of task IDs to link to this milestone

    if (!Array.isArray(taskIds)) {
        throw new BadRequestError("taskIds array is required");
    }

    const milestone = await prisma.milestone.findUnique({
        where: { id }
    });

    if (!milestone) {
        throw new NotFoundError("Milestone not found");
    }

    // Unlink any tasks currently linked to this milestone that are not in taskIds
    await prisma.task.updateMany({
        where: { milestoneId: id, id: { notIn: taskIds } },
        data: { milestoneId: null }
    });

    // Link specified tasks
    if (taskIds.length > 0) {
        await prisma.task.updateMany({
            where: { id: { in: taskIds }, projectId: milestone.projectId },
            data: { milestoneId: id }
        });
    }

    const updatedMilestone = await prisma.milestone.findUnique({
        where: { id },
        include: {
            tasks: { select: { id: true, title: true, status: true, due_date: true, priority: true } }
        }
    });

    return res.status(200).json({
        message: "Tasks linked to milestone successfully",
        milestone: updatedMilestone
    });
});
