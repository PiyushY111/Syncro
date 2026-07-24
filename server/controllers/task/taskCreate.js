import { prisma } from '../../config/prisma.js';
import { inngest } from '../../inngest/index.js';
import { notifyAssignee } from './taskHelpers.js';

// Create task
export const createTask = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, type, status, priority, projectId, assigneeId, due_date, start_date, dependenciesIds, isRecurring, recurrence } = req.body;
        const origin = req.get('origin');

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } }
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You do not have permission to create task for this project" });
        }
        else if (assigneeId && !project.members.find((member) => member.userId == assigneeId)) {
            return res.status(403).json({ message: "Assignee is not a member of this project" });
        }
        const task = await prisma.task.create({
            data: {
                title,
                description,
                type,
                status,
                priority,
                project: { connect: { id: projectId } },
                assignee: assigneeId ? { connect: { id: assigneeId } } : undefined,
                due_date: due_date ? new Date(due_date) : null,
                start_date: start_date ? new Date(start_date) : null,
                dependencies: dependenciesIds && dependenciesIds.length > 0 ? {
                    connect: dependenciesIds.map(id => ({ id }))
                } : undefined,
                isRecurring: typeof isRecurring === 'boolean' ? isRecurring : false,
                recurrence: recurrence || "NONE",
            },
        });

        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: task.id },
            include: { 
                assignee: true, 
                project: true,
                dependencies: true,
                blockedTasks: true
            }
        });

        if (taskWithAssignee?.assignee) {
            try {
                await notifyAssignee(taskWithAssignee, origin);
            } catch (emailError) {
                console.error("Email notification failed:", emailError);
            }
        }

        try {
            await inngest.send({
                name: "app/task.assigned",
                data: { taskId: task.id, origin }
            });
        } catch (inngestError) {
            console.error("Inngest send event failed:", inngestError);
        }

        return res.status(201).json({ message: "Task created successfully", task: taskWithAssignee });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Delete task
export const deleteTask = async (req, res) => {
    try {
        const userId = req.user.id;
        const { tasksIds } = req.body;
        
        if (!Array.isArray(tasksIds) || tasksIds.length === 0) {
            return res.status(400).json({ message: "tasksIds must be a non-empty array" });
        }

        const tasks = await prisma.task.findMany({
            where: { id: { in: tasksIds } },
            include: { project: true }
        });

        if (tasks.length === 0) {
            return res.status(404).json({ message: "Tasks not found" });
        }

        const unauthorizedTask = tasks.find(task => task.project.team_lead !== userId);
        if (unauthorizedTask) {
            return res.status(403).json({ message: "You do not have permission to delete one or more of these tasks" });
        }

        const deletedTasks = await prisma.task.deleteMany({
            where: { id: { in: tasksIds } },
        });

        return res.status(201).json({ message: "Task deleted successfully", task: deletedTasks });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
