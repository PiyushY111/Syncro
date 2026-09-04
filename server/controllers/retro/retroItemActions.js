import { prisma } from "../../config/prisma.js";
import { executeTransaction } from "../../services/db/dbService.js";
import { eventBus } from "../../services/eventBus.js";

export const addRetroItem = async (req, res) => {
    try {
        const { columnId } = req.params;
        const { content } = req.body;

        if (!content || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ message: "Content is required and cannot be empty" });
        }

        const column = await prisma.retroColumn.findUnique({ where: { id: columnId } });
        if (!column) return res.status(404).json({ message: "Column not found" });

        const item = await prisma.retroItem.create({
            data: { columnId, content: content.trim(), userId: req.user.id },
            include: { user: true }
        });

        await eventBus.publish('app/retro.item_added', {
            item,
            sprintId: column.sprintId
        });

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

        const { updatedItem, voteChange } = await executeTransaction(async (tx) => {
            const item = await tx.retroItem.findUnique({
                where: { id: itemId },
                include: { column: true }
            });
            if (!item) return { notFound: true };

            let updatedVoters = [...item.voters];
            let change = 0;

            if (updatedVoters.includes(userId)) {
                updatedVoters = updatedVoters.filter(id => id !== userId);
                change = -1;
            } else {
                updatedVoters.push(userId);
                change = 1;
            }

            const updated = await tx.retroItem.update({
                where: { id: itemId },
                data: { voters: updatedVoters, votes: { increment: change } },
                include: { user: true, column: true }
            });

            return { updatedItem: updated, voteChange: change };
        });

        if (!updatedItem) return res.status(404).json({ message: "Retro item not found" });

        await eventBus.publish('app/retro.item_voted', {
            item: updatedItem,
            sprintId: updatedItem.column.sprintId
        });

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

        await eventBus.publish('app/retro.item_deleted', {
            itemId,
            sprintId: item.column.sprintId
        });

        return res.status(200).json({ message: "Retro card deleted successfully" });
    } catch (error) {
        console.error("Error deleting retro card:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
