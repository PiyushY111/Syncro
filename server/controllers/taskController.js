import { prisma } from '../config/prisma.js'
import sendEmail from '../config/nodemailer.js'
import {inngest} from '../inngest/index.js'

const notifyAssignee = async (task, origin = '') => {
    if (!task?.assignee?.email) return;

    const taskUrl = origin
        ? `${origin}/taskDetails?id=${task.id}`
        : `${process.env.CLIENT_URL || 'http://localhost:5173'}/taskDetails?id=${task.id}`;

    const subject = `New task assigned: ${task.title}`;
    const text = `You have been assigned a new task "${task.title}" in project "${task.project?.name || 'Unknown project'}".`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h3>You have a new task assignment</h3>
            <p>You have been assigned the task <strong>${task.title}</strong> in project <strong>${task.project?.name || 'Unknown project'}</strong>.</p>
            <p><a href="${taskUrl}" style="color:#2563eb">Open task</a></p>
        </div>
    `;

    await sendEmail(task.assignee.email, subject, text, html);
};

const wouldCreateCycle = async (taskIdToLink, prerequisiteId) => {
    const visited = new Set();
    const dfs = async (currentId) => {
        if (currentId === taskIdToLink) return true;
        if (visited.has(currentId)) return false;
        visited.add(currentId);

        const task = await prisma.task.findUnique({
            where: { id: currentId },
            include: { dependencies: true }
        });

        if (!task || !task.dependencies) return false;

        for (const dep of task.dependencies) {
            if (await dfs(dep.id)) return true;
        }
        return false;
    };

    return await dfs(prerequisiteId);
};

// Create task 

export const createTask = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, type, status, priority, projectId, assigneeId, due_date, dependenciesIds, isRecurring, recurrence } = req.body;
        const origin = req.get('origin');

        //check if user is project lead or admin of workspace
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } }
        })
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

        res.status(201).json({ message: "Task created successfully", task: taskWithAssignee });

    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }

}

// update task
export const updateTask = async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: req.params.id },
        });
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        const userId = req.user.id;
        const { assigneeId, status, dependenciesIds } = req.body;
        const origin = req.get('origin');

        //check if user is project lead or admin of workspace
        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } }
        })
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You do not have permission to update this task" });
        }

        // 1. Dependency cycle validation
        if (dependenciesIds) {
            if (dependenciesIds.includes(req.params.id)) {
                return res.status(400).json({ message: "A task cannot depend on itself!" });
            }
            for (const depId of dependenciesIds) {
                const isCycle = await wouldCreateCycle(req.params.id, depId);
                if (isCycle) {
                    return res.status(400).json({ 
                        message: "Circular dependency detected! This prerequisite depends on the current task." 
                    });
                }
            }
        }

        // 2. Resolve target dependencies for status transition check
        let targetDeps = [];
        if (dependenciesIds) {
            targetDeps = await prisma.task.findMany({
                where: { id: { in: dependenciesIds } }
            });
        } else {
            const taskWithDeps = await prisma.task.findUnique({
                where: { id: req.params.id },
                include: { dependencies: true }
            });
            targetDeps = taskWithDeps.dependencies;
        }

        // 3. Prevent starting/completing if prerequisites are incomplete
        if (status && (status === "IN_PROGRESS" || status === "DONE")) {
            const incompleteDeps = targetDeps.filter(d => d.status !== "DONE");
            if (incompleteDeps.length > 0) {
                const names = incompleteDeps.map(d => `"${d.title}"`).join(", ");
                return res.status(400).json({ 
                    message: `Cannot start/complete task. Prerequisite task(s) ${names} must be completed first.`
                });
            }
        }

        const updateData = { ...req.body };
        delete updateData.dependenciesIds;

        if (dependenciesIds) {
            updateData.dependencies = {
                set: dependenciesIds.map(id => ({ id }))
            };
        }

        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: updateData
        })

        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: req.params.id },
            include: { 
                assignee: true, 
                project: true,
                dependencies: true,
                blockedTasks: true
            }
        });

        const assigneeChanged = typeof assigneeId !== 'undefined' && assigneeId !== task.assigneeId;
        if (assigneeChanged && taskWithAssignee?.assignee) {
            try {
                await notifyAssignee(taskWithAssignee, origin);
            } catch (emailError) {
                console.error("Email notification failed:", emailError);
            }
        }

        res.status(201).json({ message: "Task updated successfully", task: updatedTask });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
}
// delete task
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

        res.status(201).json({ message: "Task deleted successfully", task: deletedTasks });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
}

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

        // 1. Create a clone
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

        // 2. Update parent lastRecurredAt
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