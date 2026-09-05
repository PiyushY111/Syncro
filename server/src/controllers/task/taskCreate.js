import { prisma } from '../../config/prisma.js';
import { redisCache } from '../../config/redis.js';
import { eventBus } from '../../services/eventBus.js';
import { executeTransaction } from '../../services/db/dbService.js';
import { hasWorkspacePermission } from '../role/checkPermissionHelper.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors/appError.js';
import { ApiResponse } from '../../utils/response/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import logger from '../../utils/logger/logger.js';

export const createTask = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { title, description, type, status, priority, projectId, assigneeId, due_date, start_date, dependenciesIds, isRecurring, recurrence, sprintId, epicId, storyPoints } = req.body;
  const origin = req.get('origin');

  if (!projectId) {
    throw new BadRequestError("projectId is required");
  }
  if (!title) {
    throw new BadRequestError("title is required");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: { include: { user: true } },
      workspace: { include: { members: true } },
      subTeams: { include: { members: true } },
    },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  const isSubTeamMember = project.subTeams.some((subTeam) => subTeam.members.some((m) => m.userId === userId));
  const isProjectMember = project.team_lead === userId || project.members.some((m) => m.userId === userId) || isSubTeamMember;
  const hasTaskCreatePerm = await hasWorkspacePermission(userId, project.workspaceId, 'createTasks');

  if (!hasTaskCreatePerm && !isProjectMember) {
    throw new ForbiddenError("You do not have permission to create task for this project");
  }

  const assigneeHasAccess =
    project.team_lead === assigneeId ||
    project.members.some((m) => m.userId === assigneeId) ||
    project.subTeams.some((subTeam) => subTeam.members.some((m) => m.userId === assigneeId));

  if (assigneeId && !assigneeHasAccess) {
    throw new ForbiddenError("Assignee is not a member of this project");
  }

  const taskWithAssignee = await executeTransaction(async (tx) => {
    const createdTask = await tx.task.create({
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
          connect: dependenciesIds.map((id) => ({ id })),
        } : undefined,
        isRecurring: typeof isRecurring === 'boolean' ? isRecurring : false,
        recurrence: recurrence || "NONE",
        sprint: sprintId ? { connect: { id: sprintId } } : undefined,
        epic: epicId ? { connect: { id: epicId } } : undefined,
        storyPoints: storyPoints ? parseInt(storyPoints, 10) : null,
      },
    });

    return await tx.task.findUnique({
      where: { id: createdTask.id },
      include: {
        assignee: true,
        project: true,
        dependencies: true,
        blockedTasks: true,
      },
    });
  });

  // Invalidate workspace dashboard cache
  await redisCache.del(`workspace:${project.workspaceId}:dashboard`);

  await eventBus.publish('app/task.created', {
    task: taskWithAssignee,
    origin,
    auditContext: {
      workspaceId: project.workspaceId,
      userId,
      ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    },
  }).catch((err) => logger.error('[createTask] Event publication error:', { error: err.message }));

  return ApiResponse.created(res, {
    data: { task: taskWithAssignee },
    message: "Task created successfully",
  });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { tasksIds } = req.body;

  if (!Array.isArray(tasksIds) || tasksIds.length === 0) {
    throw new BadRequestError("tasksIds must be a non-empty array");
  }

  const tasks = await prisma.task.findMany({
    where: { id: { in: tasksIds } },
    include: {
      project: {
        include: { workspace: { include: { members: true } } },
      },
    },
  });

  if (tasks.length === 0) {
    throw new NotFoundError("Tasks not found");
  }

  for (const task of tasks) {
    const isLead = task.project.team_lead === userId;
    const isAssignee = task.assigneeId === userId;
    const hasRolePerm = await hasWorkspacePermission(userId, task.project.workspaceId, 'deleteTasks');

    if (!hasRolePerm && !isLead && !isAssignee) {
      throw new ForbiddenError("You do not have permission to delete one or more of these tasks");
    }
  }

  const deletedTasks = await executeTransaction(async (tx) => {
    for (const task of tasks) {
      await eventBus.publish('app/task.deleted', {
        task,
        auditContext: {
          workspaceId: task.project.workspaceId,
          userId,
          ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"],
        },
      }).catch(() => {});
    }

    return await tx.task.updateMany({
      where: { id: { in: tasksIds } },
      data: { deletedAt: new Date() },
    });
  });

  const workspaceIds = [...new Set(tasks.map(t => t.project.workspaceId))];
  for (const wsId of workspaceIds) {
    await redisCache.del(`workspace:${wsId}:dashboard`);
  }

  return ApiResponse.success(res, {
    data: { task: deletedTasks },
    message: "Tasks deleted successfully",
  });
});

export default { createTask, deleteTask };
