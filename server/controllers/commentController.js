import { prisma } from '../config/prisma.js';

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

        const workspaceMembers = project.workspace.members;
        const userMember = workspaceMembers.find(m => m.userId === userId);
        const userRole = userMember?.role || (project.workspace.ownerId === userId ? 'OWNER' : 'MEMBER');

        const isMember = project.members.some((member) => member.userId === userId);
        const isProjectLead = project.team_lead === userId;
        const isAssignee = task.assigneeId === userId;
        const isWorkspaceMember = !!userMember || project.workspace.ownerId === userId;

        const canComment = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole) || isProjectLead || isMember || isAssignee || isWorkspaceMember;

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
        return res.status(201).json({ comment, message: "Comment added successfully" });
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

        const workspaceMembers = project.workspace.members;
        const userMember = workspaceMembers.find(m => m.userId === userId);
        const userRole = userMember?.role || (project.workspace.ownerId === userId ? 'OWNER' : 'MEMBER');

        const isMember = project.members.some((member) => member.userId === userId);
        const isProjectLead = project.team_lead === userId;
        const isAssignee = task.assigneeId === userId;
        const isWorkspaceMember = !!userMember || project.workspace.ownerId === userId;

        const canViewComments = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole) || isProjectLead || isMember || isAssignee || isWorkspaceMember;

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
