import { prisma } from '../../config/prisma.js';

export const triggerRecurTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await prisma.task.findUnique({
            where: { id },
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const now = new Date();

        const clonedTask = await prisma.task.create({
            data: {
                title: `${task.title} (Recurring)`,
                description: task.description,
                type: task.type,
                status: "TODO",
                priority: task.priority,
                project: { connect: { id: task.projectId } },
                assignee: task.assigneeId ? { connect: { id: task.assigneeId } } : undefined,
                due_date: new Date(Date.now() + 24 * 60 * 60 * 1000 * (task.recurrence === "DAILY" ? 1 : task.recurrence === "WEEKLY" ? 7 : 30)),
                isRecurring: false,
                recurrence: "NONE"
            },
            include: {
                assignee: true,
                project: true,
                dependencies: true,
                blockedTasks: true
            }
        });

        const updatedTask = await prisma.task.update({
            where: { id: task.id },
            data: { lastRecurredAt: now },
            include: {
                assignee: true,
                project: true,
                dependencies: true,
                blockedTasks: true
            }
        });

        return res.json({ 
            message: "Recurring task cloned successfully", 
            clonedTask, 
            parentTask: updatedTask 
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
