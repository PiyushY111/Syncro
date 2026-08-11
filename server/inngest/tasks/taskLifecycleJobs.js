import { inngest, publishAuditLogStep, broadcastSocketEvent } from '../client.js';
import { prisma } from '../../config/prisma.js';
import sendEmail from '../../config/nodemailer.js';

export const taskCreatedJob = inngest.createFunction(
    { id: 'task-created', event: 'app/task.created' },
    async ({ event, step }) => {
        const { task, origin, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId: auditContext.workspaceId,
            userId: auditContext.userId,
            action: 'CREATE',
            entityType: 'TASK',
            entityId: task.id,
            entityName: task.title,
            newState: task,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });

        if (task.assigneeId && task.assignee) {
            await step.run('send-assignment-email', async () => {
                await sendEmail({
                    to: task.assignee.email,
                    subject: `New Task Assigned: ${task.project.name} - ${task.title}`,
                    text: `You have been assigned a new task: ${task.title}. Please check the task details at ${origin}/taskDetails?id=${task.id}`,
                    html: `<p>You have been assigned a new task: <strong>${task.title}</strong>.</p><p>Please check the task details <a href="${origin}/taskDetails?id=${task.id}">here</a>.</p>`,
                });
            });

            await step.run('create-assignment-notification', async () => {
                await prisma.notification.create({
                    data: {
                        userId: task.assigneeId,
                        workspaceId: auditContext.workspaceId,
                        type: 'TASK_ASSIGNED',
                        title: `New Task Assigned`,
                        content: `You have been assigned the task: ${task.title} in project ${task.project.name}`,
                        entityType: 'TASK',
                        entityId: task.id,
                        priority: task.priority
                    }
                });
            });
        }

        await step.run('websocket-broadcast', async () => {
            broadcastSocketEvent(`project:${task.projectId}`, 'task:created', task);
        });

        if (task.due_date) {
            const dueDate = new Date(task.due_date);
            if (dueDate.getTime() > Date.now()) {
                await step.sleepUntil('wait-until-due-date', dueDate);

                const updatedTask = await step.run('check-task-completion', async () => {
                    return await prisma.task.findUnique({
                        where: { id: task.id },
                        include: { assignee: true, project: true }
                    });
                });

                if (updatedTask && updatedTask.status !== 'DONE' && updatedTask.assignee) {
                    await sendEmail({
                        to: updatedTask.assignee.email,
                        subject: `Task Overdue: ${updatedTask.project.name} - ${updatedTask.title}`,
                        text: `The task "${updatedTask.title}" is now overdue. Please check the task details at ${origin}/taskDetails?id=${updatedTask.id}`,
                        html: `<p>The task "<strong>${updatedTask.title}</strong>" is now overdue.</p><p>Please check the task details <a href="${origin}/taskDetails?id=${updatedTask.id}">here</a>.</p>`,
                    });

                    await prisma.notification.create({
                        data: {
                            userId: updatedTask.assigneeId,
                            workspaceId: auditContext.workspaceId,
                            type: 'TASK_DUE',
                            title: `Task Overdue`,
                            content: `The task: ${updatedTask.title} is now overdue.`,
                            entityType: 'TASK',
                            entityId: updatedTask.id,
                            priority: 'HIGH'
                        }
                    });
                }
            }
        }
    }
);

export const taskDeletedJob = inngest.createFunction(
    { id: 'task-deleted', event: 'app/task.deleted' },
    async ({ event, step }) => {
        const { task, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId: auditContext.workspaceId,
            userId: auditContext.userId,
            action: 'DELETE',
            entityType: 'TASK',
            entityId: task.id,
            entityName: task.title,
            previousState: task,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });

        await step.run('websocket-broadcast', async () => {
            broadcastSocketEvent(`project:${task.projectId}`, 'task:deleted', { id: task.id });
        });
    }
);
