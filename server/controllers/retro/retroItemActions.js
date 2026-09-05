import { prisma } from "../../config/prisma.js";
import { executeTransaction } from "../../services/db/dbService.js";
import { eventBus } from "../../services/eventBus.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";

export const addRetroItem = asyncHandler(async (req, res) => {
    const { columnId } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
        throw new BadRequestError("Content is required and cannot be empty");
    }

    const column = await prisma.retroColumn.findUnique({ where: { id: columnId } });
    if (!column) throw new NotFoundError("Column not found");

    const item = await prisma.retroItem.create({
        data: { columnId, content: content.trim(), userId: req.user.id },
        include: { user: true }
    });

    await eventBus.publish('app/retro.item_added', {
        item,
        sprintId: column.sprintId
    });

    return res.status(201).json({ message: "Feedback card added", item });
});

export const voteRetroItem = asyncHandler(async (req, res) => {
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

    if (!updatedItem) throw new NotFoundError("Retro item not found");

    await eventBus.publish('app/retro.item_voted', {
        item: updatedItem,
        sprintId: updatedItem.column.sprintId
    });

    return res.status(200).json({ message: voteChange === 1 ? "Vote added" : "Vote removed", item: updatedItem });
});

export const deleteRetroItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const item = await prisma.retroItem.findUnique({
        where: { id: itemId },
        include: { column: true }
    });
    if (!item) throw new NotFoundError("Retro card not found");

    if (item.userId !== req.user.id) {
        throw new ForbiddenError("You are not authorized to delete this feedback card");
    }

    await prisma.retroItem.delete({ where: { id: itemId } });

    await eventBus.publish('app/retro.item_deleted', {
        itemId,
        sprintId: item.column.sprintId
    });

    return res.status(200).json({ message: "Retro card deleted successfully" });
});
