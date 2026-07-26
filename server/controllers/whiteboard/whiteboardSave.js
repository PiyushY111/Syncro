import { prisma } from '../../config/prisma.js';

// Update/Save whiteboard elements and viewport
export const saveWhiteboard = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, name, pages, currentPageId } = req.body;

        const updateData = {};
        if (data !== undefined) updateData.data = data;
        if (name !== undefined) updateData.name = name.trim();
        if (pages !== undefined) updateData.pages = pages;
        if (currentPageId !== undefined) updateData.currentPageId = currentPageId;

        const whiteboard = await prisma.whiteboard.update({
            where: { id },
            data: updateData
        });

        return res.status(200).json(whiteboard);
    } catch (err) {
        console.error("[SAVE WHITEBOARD ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};

// Share whiteboard with email list (only creator can share)
export const shareWhiteboard = async (req, res) => {
    try {
        const { id } = req.params;
        const { emails } = req.body;
        if (!Array.isArray(emails)) {
            return res.status(400).json({ message: 'emails must be an array of strings' });
        }
        const board = await prisma.whiteboard.findUnique({ where: { id } });
        if (!board) {
            return res.status(404).json({ message: 'Whiteboard not found' });
        }
        if (board.creatorId && board.creatorId !== req.user.id) {
            return res.status(403).json({ message: 'Only the creator can share this whiteboard' });
        }
        const updated = await prisma.whiteboard.update({
            where: { id },
            data: { sharedEmails: emails }
        });
        return res.status(200).json(updated);
    } catch (err) {
        console.error("[SHARE WHITEBOARD ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};
