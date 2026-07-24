import { prisma } from "../../config/prisma.js";

export const createMilestone = async (req, res) => {
    try {
        const { projectId, title, description, dueDate, startDate, status, color } = req.body;

        if (!projectId || !title || !dueDate) {
            return res.status(400).json({ message: "projectId, title, and dueDate are required" });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const milestone = await prisma.milestone.create({
            data: {
                title,
                description: description || "",
                dueDate: new Date(dueDate),
                startDate: startDate ? new Date(startDate) : null,
                status: status || "PLANNED",
                color: color || "#3B82F6",
                projectId
            },
            include: {
                tasks: {
                    include: { assignee: true }
                }
            }
        });

        return res.status(201).json({
            message: "Milestone created successfully",
            milestone
        });
    } catch (error) {
        console.error("Error creating milestone:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
