import { prisma } from '../config/prisma.js';
import { getUserWorkspaceRole } from './role/checkPermissionHelper.js';
import { eventBus } from '../services/eventBus.js';

export const addComment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, taskId } = req.body;

        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { 
                members: { include: { user: true } },
                workspace: { include: { members: true } }
            }
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const { role, isOwner } = await getUserWorkspaceRole(userId, project.workspaceId);
        const isWorkspaceMember = !!role;

        const isMember = project.members.some((member) => member.userId === userId);
        const isProjectLead = project.team_lead === userId;
        const isAssignee = task.assigneeId === userId;

        const canComment = isOwner || ['OWNER', 'ADMIN', 'MANAGER'].includes(role) || isProjectLead || isMember || isAssignee || isWorkspaceMember;

        if (!canComment) {
            return res.status(403).json({ message: "You do not have permission to comment on this task" });
        }
        const comment = await prisma.comment.create({
            data: {
                content,
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
        });

        return res.status(201).json({ comment: commentWithUser, message: "Comment added successfully" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getComments = async (req, res) => {
    try {
        const userId = req.user.id;
        const { taskId } = req.params;
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { 
                members: { include: { user: true } },
                workspace: { include: { members: true } }
            }
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const { role, isOwner } = await getUserWorkspaceRole(userId, project.workspaceId);
        const isWorkspaceMember = !!role;

        const isMember = project.members.some((member) => member.userId === userId);
        const isProjectLead = project.team_lead === userId;
        const isAssignee = task.assigneeId === userId;

        const canViewComments = isOwner || ['OWNER', 'ADMIN', 'MANAGER'].includes(role) || isProjectLead || isMember || isAssignee || isWorkspaceMember;

        if (!canViewComments) {
            return res.status(403).json({ message: "You do not have permission to view comments for this task" });
        }
        const comments = await prisma.comment.findMany({
            where: { taskId },
            include: { user: true }
        });
        return res.status(200).json({ comments });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
