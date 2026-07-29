import { prisma } from "../../config/prisma.js";

// Helper to check general project membership/access
const hasAccess = async (userId, sprintId) => {
    const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
        include: { project: true }
    });
    if (!sprint) return false;
    return sprint.projectId;
};

// 1. Initialize Retro Board Columns (e.g. Went Well, Needs Improvement, Action Items)
export const initializeRetro = async (req, res) => {
    try {
        const { sprintId } = req.params;

        const projectId = await hasAccess(req.user.id, sprintId);
        if (!projectId) {
            return res.status(403).json({ message: "Access denied" });
        }

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
                data: {
                    sprintId,
                    title
                }
            });
            columns.push(col);
        }

        return res.status(201).json({
            message: "Retro board initialized successfully",
            columns
        });
    } catch (error) {
        console.error("Error initializing retro board:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// 2. Fetch Retro Board (Columns + Items)
export const getSprintRetro = async (req, res) => {
    try {
        const { sprintId } = req.params;

        const projectId = await hasAccess(req.user.id, sprintId);
        if (!projectId) {
            return res.status(403).json({ message: "Access denied" });
        }

        const columns = await prisma.retroColumn.findMany({
            where: { sprintId },
            include: {
                items: {
                    include: { user: true },
                    orderBy: { votes: "desc" }
                }
            },
            orderBy: { title: "asc" } // Keep columns stable (Action Items, What can be improved, What went well)
        });

        return res.status(200).json({ columns });
    } catch (error) {
        console.error("Error fetching retro board:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// 3. Add Retro Feedback Card
export const addRetroItem = async (req, res) => {
    try {
        const { columnId } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: "Content is required" });
        }

        const column = await prisma.retroColumn.findUnique({
            where: { id: columnId }
        });

        if (!column) {
            return res.status(404).json({ message: "Column not found" });
        }

        const item = await prisma.retroItem.create({
            data: {
                columnId,
                content,
                userId: req.user.id
            },
            include: { user: true }
        });

        // Trigger Socket.io broadcast (handled in Socket wrapper if active)
        if (global.io) {
            global.io.to(`sprint-${column.sprintId}`).emit("retro:item_added", item);
        }

        return res.status(201).json({
            message: "Feedback card added",
            item
        });
    } catch (error) {
        console.error("Error adding retro card:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// 4. Toggle Vote on Retro Card
export const voteRetroItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user.id;

        const item = await prisma.retroItem.findUnique({
            where: { id: itemId },
            include: { column: true }
        });

        if (!item) {
            return res.status(404).json({ message: "Retro item not found" });
        }

        let updatedVoters = [...item.voters];
        let voteChange = 0;

        if (updatedVoters.includes(userId)) {
            // Unvote
            updatedVoters = updatedVoters.filter(id => id !== userId);
            voteChange = -1;
        } else {
            // Vote
            updatedVoters.push(userId);
            voteChange = 1;
        }

        const updatedItem = await prisma.retroItem.update({
            where: { id: itemId },
            data: {
                voters: updatedVoters,
                votes: { increment: voteChange }
            },
            include: { user: true }
        });

        // Emit Socket event to sync other users instantly
        if (global.io) {
            global.io.to(`sprint-${item.column.sprintId}`).emit("retro:item_voted", updatedItem);
        }

        return res.status(200).json({
            message: voteChange === 1 ? "Vote added" : "Vote removed",
            item: updatedItem
        });
    } catch (error) {
        console.error("Error voting on retro card:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// 5. Delete Retro Feedback Card
export const deleteRetroItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        const item = await prisma.retroItem.findUnique({
            where: { id: itemId },
            include: { column: true }
        });

        if (!item) {
            return res.status(404).json({ message: "Retro card not found" });
        }

        // Only creator can delete
        if (item.userId !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized to delete this feedback card" });
        }

        await prisma.retroItem.delete({
            where: { id: itemId }
        });

        if (global.io) {
            global.io.to(`sprint-${item.column.sprintId}`).emit("retro:item_deleted", { itemId });
        }

        return res.status(200).json({ message: "Retro card deleted successfully" });
    } catch (error) {
        console.error("Error deleting retro card:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
