import { prisma } from '../../config/prisma.js';
import { wouldCreateCycle } from './taskHelpers.js';
import { hasWorkspacePermission } from '../role/checkPermissionHelper.js';
import { eventBus } from '../../services/eventBus.js';

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
            include: { 
                members: { include: { user: true } },
                workspace: { include: { members: true } },
                subTeams: { include: { members: true } }
            }
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isLead = project.team_lead === userId;
        const isAssignee = task.assigneeId === userId;
        const isMember = project.members.some(m => m.userId === userId);
        const isSubTeamMember = project.subTeams.some(subTeam => subTeam.members.some(m => m.userId === userId));
        
        const hasTaskUpdatePerm = await hasWorkspacePermission(userId, project.workspaceId, 'editTasks');
        const canUpdate = hasTaskUpdatePerm || isLead || isAssignee || isMember || isSubTeamMember;

        if (!canUpdate) {
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

        const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;
        if (expectedVersion !== undefined && task.version !== expectedVersion) {
            return res.status(409).json({ message: "Conflict: Task was modified by another user. Please refresh and try again." });
        }

        const updateData = { ...req.body };
        delete updateData.dependenciesIds;
        delete updateData.expectedVersion;
        if (updateData.due_date) updateData.due_date = new Date(updateData.due_date);
        if (updateData.start_date) updateData.start_date = new Date(updateData.start_date);
        updateData.version = { increment: 1 };

        if (dependenciesIds) {
            updateData.dependencies = {
                set: dependenciesIds.map(id => ({ id }))
            };
        }

        const previousState = await prisma.task.findUnique({
            where: { id: req.params.id },
            include: { 
                assignee: true, 
                project: true,
                dependencies: true,
                blockedTasks: true
            }
        });

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

        await eventBus.publish('app/task.updated', {
            task: taskWithAssignee,
            previousTask: previousState,
            origin,
            auditContext: {
                workspaceId: project.workspaceId,
                userId,
                ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                userAgent: req.headers["user-agent"]
            }
        });

        return res.status(201).json({ message: "Task updated successfully", task: taskWithAssignee });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
