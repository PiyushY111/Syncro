import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/response/apiResponse.js";

export const getProjectEpics = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const epics = await prisma.epic.findMany({
        where: { projectId },
        include: { tasks: true },
        orderBy: { createdAt: "desc" }
    });

    const epicsWithProgress = epics.map(epic => {
        const totalTasks = epic.tasks ? epic.tasks.length : 0;
        const completedTasks = epic.tasks ? epic.tasks.filter(t => t.status === "DONE").length : 0;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        return {
            ...epic,
            progress,
            totalTasks,
            completedTasks
        };
    });

    return ApiResponse.success(res, {
        data: { epics: epicsWithProgress }
    });
});

export default getProjectEpics;
