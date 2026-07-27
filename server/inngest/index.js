import 'dotenv/config'
import sendEmail from '../config/nodemailer.js';

if (!process.env.INNGEST_SIGNING_KEY && process.env.INNGEST_SECRET_KEY) {
    process.env.INNGEST_SIGNING_KEY = process.env.INNGEST_SECRET_KEY;
}
import { Inngest, step } from 'inngest'
import { prisma } from '../config/prisma.js';

export const inngest = new Inngest({ id: 'Project Management' })

// Inngest function to send email on task creation
const sendTaskAssignmentEmail = inngest.createFunction(
    { id: 'send-task-assignment-email', triggers: { event: 'app/task.assigned' } },
    async ({ event }) => {
        const { taskId, origin } = event.data;

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                assignee: true,
                project: true
            }
        });

        if (!task || !task.assignee) return;

        await sendEmail({
            to: task.assignee.email,
            subject: `New Task Assigned: ${task.project.name} - ${task.title}`,
            text: `You have been assigned a new task: ${task.title}. Please check the task details at ${origin}/taskDetails?id=${task.id}`,
            html: `<p>You have been assigned a new task: <strong>${task.title}</strong>.</p><p>Please check the task details <a href="${origin}/taskDetails?id=${task.id}">here</a>.</p>`,
        });

        if (task.due_date) {
            const dueDate = new Date(task.due_date);
            // Only sleep and remind if the due date is in the future
            if (dueDate.getTime() > Date.now()) {
                await step.sleepUntil('wait-until-due-date', dueDate);

                const updatedTask = await step.run('check-task-completion', async () => {
                    return await prisma.task.findUnique({
                        where: { id: taskId },
                        include: { assignee: true }
                    });
                });

                if (updatedTask && updatedTask.status !== 'DONE' && updatedTask.assignee) {
                    await sendEmail({
                        to: updatedTask.assignee.email,
                        subject: `Task Overdue: ${task.project.name} - ${task.title}`,
                        text: `The task "${task.title}" is now overdue. Please check the task details at ${origin}/taskDetails?id=${task.id}`,
                        html: `<p>The task "<strong>${task.title}</strong>" is now overdue.</p><p>Please check the task details <a href="${origin}/taskDetails?id=${task.id}">here</a>.</p>`,
                    });
                }
            }
        }
    }
)

// Distributed Cron Job Scheduler running every minute to process recurring tasks safely in clustered environments
const recurrenceJob = inngest.createFunction(
    { id: 'recurrence-scheduler-cron', cron: '* * * * *' },
    async ({ step }) => {
        await step.run('process-all-recurring-tasks', async () => {
            const now = new Date();
            const recurringTasks = await prisma.task.findMany({
                where: {
                    isRecurring: true,
                    recurrence: { in: ["DAILY", "WEEKLY", "MONTHLY"] }
                }
            });

            for (const task of recurringTasks) {
                const referenceDate = task.lastRecurredAt || task.createdAt;
                const diffTime = now.getTime() - new Date(referenceDate).getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                let shouldRecur = false;
                if (task.recurrence === "DAILY" && diffDays >= 1) {
                    shouldRecur = true;
                } else if (task.recurrence === "WEEKLY" && diffDays >= 7) {
                    shouldRecur = true;
                } else if (task.recurrence === "MONTHLY" && diffDays >= 30) {
                    shouldRecur = true;
                }

                if (shouldRecur) {
                    // Create new cloned task
                    await prisma.task.create({
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
                        }
                    });

                    // Update parent lastRecurredAt
                    await prisma.task.update({
                        where: { id: task.id },
                        data: { lastRecurredAt: now }
                    });
                }
            }
        });
    }
);

export const functions = [
    sendTaskAssignmentEmail,
    recurrenceJob
];