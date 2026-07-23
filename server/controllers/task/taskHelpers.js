import { prisma } from '../../config/prisma.js';
import sendEmail from '../../config/nodemailer.js';

export const notifyAssignee = async (task, origin = '') => {
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

export const wouldCreateCycle = async (taskIdToLink, prerequisiteId) => {
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
