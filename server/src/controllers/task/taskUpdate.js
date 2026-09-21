import { prisma } from '../../config/prisma.js';
import { wouldCreateCycle, assertAssigneeBelongsToProject, assertTaskForeignRefsBelongToProject } from './taskHelpers.js';
import logger from '../../utils/logger/logger.js';
import { hasWorkspacePermission } from '../role/checkPermissionHelper.js';
import { eventBus } from '../../services/eventBus.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/response/apiResponse.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../../utils/errors/appError.js';
import { redisCache } from '../../config/redis.js';

const ALLOWED_TASK_UPDATE_FIELDS = [
    'title', 'description', 'type', 'status', 'priority', 'assigneeId',
    'due_date', 'start_date', 'stageId', 'sprintId', 'epicId',
    'storyPoints', 'isRecurring', 'recurrence', 'milestoneId'
];

// Update task
export const updateTask = asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({
        where: { id: req.params.id },
    });
    if (!task) {
        throw new NotFoundError("Task not found");
    }
    const userId = req.user.id;
    const { assigneeId, status, dependenciesIds, sprintId, epicId, milestoneId } = req.body;
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
        throw new NotFoundError("Project not found");
    }

    const isLead = project.team_lead === userId;
    const isAssignee = task.assigneeId === userId;
    const isMember = project.members.some(m => m.userId === userId);
    const isSubTeamMember = project.subTeams.some(subTeam => subTeam.members.some(m => m.userId === userId));
    
    const hasTaskUpdatePerm = await hasWorkspacePermission(userId, project.workspaceId, 'editTasks');
    const canUpdate = hasTaskUpdatePerm || isLead || isAssignee || isMember || isSubTeamMember;

    if (!canUpdate) {
        throw new ForbiddenError("You do not have permission to update this task");
    }

    assertAssigneeBelongsToProject(project, assigneeId);
    await assertTaskForeignRefsBelongToProject({
        projectId: project.id,
        sprintId,
        epicId,
        milestoneId,
        dependenciesIds,
    });

    if (dependenciesIds) {
        if (!Array.isArray(dependenciesIds)) {
            throw new BadRequestError("dependenciesIds must be an array");
        }
        if (dependenciesIds.includes(req.params.id)) {
            throw new BadRequestError("A task cannot depend on itself!");
        }
        for (const depId of dependenciesIds) {
            const isCycle = await wouldCreateCycle(req.params.id, depId);
            if (isCycle) {
                throw new BadRequestError("Circular dependency detected! This prerequisite depends on the current task.");
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
        targetDeps = taskWithDeps?.dependencies || [];
    }

    if (status && (status === "IN_PROGRESS" || status === "DONE")) {
        const incompleteDeps = targetDeps.filter(d => d.status !== "DONE");
        if (incompleteDeps.length > 0) {
            const names = incompleteDeps.map(d => `"${d.title}"`).join(", ");
            throw new BadRequestError(`Cannot start/complete task. Prerequisite task(s) ${names} must be completed first.`);
        }
    }

    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;
    if (expectedVersion !== undefined && task.version !== expectedVersion) {
        throw new ConflictError("Conflict: Task was modified by another user. Please refresh and try again.");
    }

    // Explicit field whitelist to prevent mass-assignment vulnerabilities
    const updateData = {};
    for (const field of ALLOWED_TASK_UPDATE_FIELDS) {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    }

    if (updateData.due_date) updateData.due_date = new Date(updateData.due_date);
    if (updateData.start_date) updateData.start_date = new Date(updateData.start_date);
    if (updateData.storyPoints !== undefined) {
        updateData.storyPoints = updateData.storyPoints ? parseInt(updateData.storyPoints, 10) : null;
    }
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

    await prisma.task.update({
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

    // Invalidate project & workspace dashboard cache
    await redisCache.del(`workspace:${project.workspaceId}:dashboard`);

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
    }).catch(err => logger.error('[updateTask] Event publishing error:', { error: err.message, userId, requestId: req.headers['x-request-id'] }));

    return ApiResponse.success(res, {
        data: { task: taskWithAssignee },
        message: "Task updated successfully"
    });
});

export default updateTask;
