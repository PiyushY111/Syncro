import { prisma } from "../../config/prisma.js";

export const createPortfolio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId, name, description, color, icon, status, projectIds } = req.body;

        if (!workspaceId || !name) {
            return res.status(400).json({ message: "workspaceId and name are required" });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const portfolio = await prisma.portfolio.create({
            data: {
                name,
                description: description || "",
                color: color || "#6366F1",
                icon: icon || "FolderKanban",
                status: status || "ACTIVE",
                workspaceId,
                ownerId: userId
            }
        });

        if (Array.isArray(projectIds) && projectIds.length > 0) {
            await prisma.portfolioProject.createMany({
                data: projectIds.map((pid, idx) => ({
                    portfolioId: portfolio.id,
                    projectId: pid,
                    order: idx
                }))
            });
        }

        const fullPortfolio = await prisma.portfolio.findUnique({
            where: { id: portfolio.id },
            include: {
                projects: {
                    include: {
                        project: {
                            include: { owner: true, tasks: true }
                        }
                    }
                },
                owner: true
            }
        });

        return res.status(201).json({
            message: "Portfolio created successfully",
            portfolio: fullPortfolio
        });
    } catch (error) {
        console.error("Error creating portfolio:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
