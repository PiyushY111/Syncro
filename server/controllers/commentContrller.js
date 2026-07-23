import { prisma } from '../config/prisma.js'


export const addComment = async (req, res) => {

    try {
        const userId = req.user.id;
        const { content, taskId } = req.body;

        //check if user is projectMember
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });
        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } }
        });

        const isMember = project.members.some((member) => member.userId === userId);
        const isProjectLead = project.team_lead === userId;
        if (!isMember && !isProjectLead) {
            return res.status(403).json({ message: "You do not have permission to comment on this task" });
        }
        const comment = await prisma.comment.create({
            data: {
                content,
                task: { connect: { id: taskId } },
                user: { connect: { id: userId } },
            }
        });
        res.status(201).json({ comment, message: "Comment added successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
}

// get comments of a task
export const getComments = async (req, res) => {
    try {
        const userId = req.user.id;
        const { taskId } = req.params;
        //check if user is projectMember
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });
        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } }
        });
        const isMember = project.members.some((member) => member.userId === userId);
        const isProjectLead = project.team_lead === userId;
        if (!isMember && !isProjectLead) {
            return res.status(403).json({ message: "You do not have permission to view comments for this task" });
        }
        const comments = await prisma.comment.findMany({
            where: { taskId },
            include: { user: true }
        });
        res.status(200).json({ comments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};
