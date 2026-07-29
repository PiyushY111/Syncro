import { prisma } from "../../config/prisma.js";

export const getProjectEpics = async (req, res) => {
    try {
        const { projectId } = req.params;

        const epics = await prisma.epic.findMany({
            where: { projectId },
            include: { tasks: true },
            orderBy: { createdAt: "desc" }
        });

        const epicsWithProgress = epics.map(epic => {
            const totalTasks = epic.tasks.length;
            const completedTasks = epic.tasks.filter(t => t.status === "DONE").length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            return {
                ...epic,
                progress,
                totalTasks,
                completedTasks
            };
        });

        return res.status(200).json({ epics: epicsWithProgress });
    } catch (error) {
        console.error("Error fetching project Epics:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
