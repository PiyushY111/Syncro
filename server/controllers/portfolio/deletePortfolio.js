import { prisma } from "../../config/prisma.js";

export const deletePortfolio = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.portfolio.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Portfolio not found" });
        }

        await prisma.portfolio.delete({ where: { id } });

        return res.status(200).json({ message: "Portfolio deleted successfully" });
    } catch (error) {
        console.error("Error deleting portfolio:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
