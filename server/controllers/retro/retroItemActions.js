import { prisma } from "../../config/prisma.js";

export const addRetroItem = async (req, res) => {
    try {
        const { columnId } = req.params;
        const { content } = req.body;

        if (!content) return res.status(400).json({ message: "Content is required" });

        const column = await prisma.retroColumn.findUnique({ where: { id: columnId } });
        if (!column) return res.status(404).json({ message: "Column not found" });

        const item = await prisma.retroItem.create({
            data: { columnId, content, userId: req.user.id },
            include: { user: true }
        });

        if (global.io) {
            global.io.to(`sprint-${column.sprintId}`).emit("retro:item_added", item);
        }

        return res.status(201).json({ message: "Feedback card added", item });
    } catch (error) {
        console.error("Error adding retro card:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const voteRetroItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user.id;

        const item = await prisma.retroItem.findUnique({
            where: { id: itemId },
            include: { column: true }
        });
        if (!item) return res.status(404).json({ message: "Retro item not found" });

        let updatedVoters = [...item.voters];
        let voteChange = 0;

        if (updatedVoters.includes(userId)) {
            updatedVoters = updatedVoters.filter(id => id !== userId);
            voteChange = -1;
        } else {
            updatedVoters.push(userId);
            voteChange = 1;
        }

        const updatedItem = await prisma.retroItem.update({
            where: { id: itemId },
            data: { voters: updatedVoters, votes: { increment: voteChange } },
            include: { user: true }
        });

        if (global.io) {
            global.io.to(`sprint-${item.column.sprintId}`).emit("retro:item_voted", updatedItem);
        }

        return res.status(200).json({ message: voteChange === 1 ? "Vote added" : "Vote removed", item: updatedItem });
    } catch (error) {
        console.error("Error voting on retro card:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteRetroItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const item = await prisma.retroItem.findUnique({
            where: { id: itemId },
            include: { column: true }
        });
        if (!item) return res.status(404).json({ message: "Retro card not found" });

        if (item.userId !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized to delete this feedback card" });
        }

        await prisma.retroItem.delete({ where: { id: itemId } });

        if (global.io) {
            global.io.to(`sprint-${item.column.sprintId}`).emit("retro:item_deleted", { itemId });
        }

        return res.status(200).json({ message: "Retro card deleted successfully" });
    } catch (error) {
        console.error("Error deleting retro card:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
