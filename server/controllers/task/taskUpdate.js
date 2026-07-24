import { prisma } from '../../config/prisma.js';
import { notifyAssignee, wouldCreateCycle } from './taskHelpers.js';

// Update task
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

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } }
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You do not have permission to update this task" });
        }

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
        if (updateData.due_date) updateData.due_date = new Date(updateData.due_date);
        if (updateData.start_date) updateData.start_date = new Date(updateData.start_date);

        if (dependenciesIds) {
            updateData.dependencies = {
                set: dependenciesIds.map(id => ({ id }))
            };
        }

        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: updateData
        });

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

        return res.status(201).json({ message: "Task updated successfully", task: updatedTask });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
