import { prisma } from "../../config/prisma.js";

const hasAccess = async (userId, sprintId) => {
    const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
        include: { project: true }
    });
    if (!sprint) return false;
    return sprint.projectId;
};

export const initializeRetro = async (req, res) => {
    try {
        const { sprintId } = req.params;
        const projectId = await hasAccess(req.user.id, sprintId);
        if (!projectId) return res.status(403).json({ message: "Access denied" });

        const existingColumns = await prisma.retroColumn.findMany({
            where: { sprintId }
        });
        if (existingColumns.length > 0) {
            return res.status(200).json({ message: "Retro columns already initialized", columns: existingColumns });
        }

        const defaultTitles = ["What went well", "What can be improved", "Action Items"];
        const columns = [];
        for (const title of defaultTitles) {
            const col = await prisma.retroColumn.create({
                data: { sprintId, title }
            });
            columns.push(col);
        }

        return res.status(201).json({ message: "Retro board initialized successfully", columns });
    } catch (error) {
        console.error("Error initializing retro board:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getSprintRetro = async (req, res) => {
    try {
        const { sprintId } = req.params;
        const projectId = await hasAccess(req.user.id, sprintId);
        if (!projectId) return res.status(403).json({ message: "Access denied" });

        const columns = await prisma.retroColumn.findMany({
            where: { sprintId },
            include: {
                items: {
                    include: { user: true },
                    orderBy: { votes: "desc" }
                }
            },
            orderBy: { title: "asc" }
        });

        return res.status(200).json({ columns });
    } catch (error) {
        console.error("Error fetching retro board:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
