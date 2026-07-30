import { inngest } from '../client.js';
import { prisma } from '../../config/prisma.js';

export const recurrenceJob = inngest.createFunction(
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
                    const nextDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000 * (task.recurrence === "DAILY" ? 1 : task.recurrence === "WEEKLY" ? 7 : 30));
                    
                    const clonedTask = await prisma.task.create({
                        data: {
                            title: `${task.title} (Recurring)`,
                            description: task.description,
                            type: task.type,
                            status: "TODO",
                            priority: task.priority,
                            project: { connect: { id: task.projectId } },
                            assignee: task.assigneeId ? { connect: { id: task.assigneeId } } : undefined,
                            due_date: nextDueDate,
                            isRecurring: false,
                            recurrence: "NONE"
                        },
                        include: {
                            assignee: true,
                            project: true
                        }
                    });

                    await inngest.send({
                        name: 'app/task.created',
                        data: {
                            task: clonedTask,
                            origin: process.env.CLIENT_URL || 'http://localhost:5173',
                            auditContext: {
                                workspaceId: task.project?.workspaceId || clonedTask.project.workspaceId,
                                userId: task.assigneeId || 'System',
                                ipAddress: '127.0.0.1',
                                userAgent: 'System Scheduler'
                            }
                        }
                    });

                    await prisma.task.update({
                        where: { id: task.id },
                        data: { lastRecurredAt: now }
                    });
                }
            }
        });
    }
);
