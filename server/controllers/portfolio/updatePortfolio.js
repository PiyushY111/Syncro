import { prisma } from "../../config/prisma.js";

export const updatePortfolio = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color, icon, status } = req.body;

        const existing = await prisma.portfolio.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Portfolio not found" });
        }

        const dataToUpdate = {};
        if (name !== undefined) dataToUpdate.name = name;
        if (description !== undefined) dataToUpdate.description = description;
        if (color !== undefined) dataToUpdate.color = color;
        if (icon !== undefined) dataToUpdate.icon = icon;
        if (status !== undefined) dataToUpdate.status = status;

        const updated = await prisma.portfolio.update({
            where: { id },
            data: dataToUpdate,
            include: {
                projects: { include: { project: true } },
                owner: true
            }
        });

        return res.status(200).json({
            message: "Portfolio updated successfully",
            portfolio: updated
        });
    } catch (error) {
        console.error("Error updating portfolio:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
