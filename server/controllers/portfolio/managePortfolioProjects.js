import { prisma } from "../../config/prisma.js";

export const addProjectsToPortfolio = async (req, res) => {
    try {
        const { id } = req.params;
        const { projectIds } = req.body;

        if (!Array.isArray(projectIds) || projectIds.length === 0) {
            return res.status(400).json({ message: "projectIds array is required" });
        }

        const portfolio = await prisma.portfolio.findUnique({ where: { id } });
        if (!portfolio) {
            return res.status(404).json({ message: "Portfolio not found" });
        }

        const currentCount = await prisma.portfolioProject.count({ where: { portfolioId: id } });

        const newEntries = projectIds.map((pid, index) => ({
            portfolioId: id,
            projectId: pid,
            order: currentCount + index
        }));

        await prisma.portfolioProject.createMany({
            data: newEntries,
            skipDuplicates: true
        });

        return res.status(200).json({ message: "Projects added to portfolio successfully" });
    } catch (error) {
        console.error("Error adding projects to portfolio:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const removeProjectFromPortfolio = async (req, res) => {
    try {
        const { id, projectId } = req.params;

        await prisma.portfolioProject.deleteMany({
            where: { portfolioId: id, projectId }
        });

        return res.status(200).json({ message: "Project removed from portfolio" });
    } catch (error) {
        console.error("Error removing project from portfolio:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
