import { prisma } from '../config/prisma.js';
import { getUserWorkspaceRole } from './role/checkPermissionHelper.js';
import { eventBus } from '../services/eventBus.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response/apiResponse.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors/appError.js';

/**
 * Shared authorization predicate to verify if a user has access to task comments.
 */
export const canAccessTaskComments = async (userId, task, project) => {
    const { role, isOwner } = await getUserWorkspaceRole(userId, project.workspaceId);
    const isWorkspaceMember = Boolean(role);
    const isMember = project.members?.some((member) => member.userId === userId);
    const isProjectLead = project.team_lead === userId;
    const isAssignee = task.assigneeId === userId;

    return Boolean(
        isOwner ||
        ['OWNER', 'ADMIN', 'MANAGER'].includes(role) ||
        isProjectLead ||
        isMember ||
        isAssignee ||
        isWorkspaceMember
    );
};

export const addComment = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { content, taskId } = req.body;

    if (!taskId) {
        throw new BadRequestError("taskId is required");
    }
    if (!content || !content.trim()) {
        throw new BadRequestError("Comment content cannot be empty");
    }

    const task = await prisma.task.findUnique({
        where: { id: taskId },
    });
    if (!task) {
        throw new NotFoundError("Task not found");
    }

    const project = await prisma.project.findUnique({
        where: { id: task.projectId },
        include: { 
            members: { include: { user: true } },
            workspace: { include: { members: true } }
        }
    });
    if (!project) {
        throw new NotFoundError("Project not found");
    }

    const canComment = await canAccessTaskComments(userId, task, project);
    if (!canComment) {
        throw new ForbiddenError("You do not have permission to comment on this task");
    }

    const comment = await prisma.comment.create({
        data: {
            content: content.trim(),
            task: { connect: { id: taskId } },
            user: { connect: { id: userId } },
        }
    });

    const commentWithUser = await prisma.comment.findUnique({
        where: { id: comment.id },
        include: { user: true, task: { include: { assignee: true, project: true } } }
    });

    await eventBus.publish('app/comment.created', {
        comment: commentWithUser,
        auditContext: {
            workspaceId: project.workspaceId,
            userId,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    }).catch(err => console.error('[addComment] Event publication error:', err));

    return ApiResponse.created(res, {
        data: { comment: commentWithUser },
        message: "Comment added successfully"
    });
});

export const getComments = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
        where: { id: taskId },
    });
    if (!task) {
        throw new NotFoundError("Task not found");
    }

    const project = await prisma.project.findUnique({
        where: { id: task.projectId },
        include: { 
            members: { include: { user: true } },
            workspace: { include: { members: true } }
        }
    });
    if (!project) {
        throw new NotFoundError("Project not found");
    }

    const canViewComments = await canAccessTaskComments(userId, task, project);
    if (!canViewComments) {
        throw new ForbiddenError("You do not have permission to view comments for this task");
    }

    const comments = await prisma.comment.findMany({
        where: { taskId },
        include: { user: true },
        orderBy: { createdAt: "asc" }
    });

    return ApiResponse.success(res, {
        data: { comments }
    });
});

export default {
    canAccessTaskComments,
    addComment,
    getComments,
};
