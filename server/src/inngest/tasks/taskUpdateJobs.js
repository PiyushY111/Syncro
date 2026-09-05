import { inngest, publishAuditLogStep, broadcastSocketEvent } from '../client.js';
import { prisma } from '../../config/prisma.js';
import sendEmail from '../../config/nodemailer.js';

export const taskUpdatedJob = inngest.createFunction(
    { id: 'task-updated', event: 'app/task.updated' },
    async ({ event, step }) => {
        const { task, previousTask, origin, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId: auditContext.workspaceId,
            userId: auditContext.userId,
            action: 'UPDATE',
            entityType: 'TASK',
            entityId: task.id,
            entityName: task.title,
            previousState: previousTask,
            newState: task,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });

        await step.run('websocket-broadcast', async () => {
            broadcastSocketEvent(`project:${task.projectId}`, 'task:updated', task);
        });

        if (task.assigneeId && task.assigneeId !== previousTask.assigneeId && task.assignee) {
            await step.run('send-new-assignee-email', async () => {
                await sendEmail({
                    to: task.assignee.email,
                    subject: `New Task Assigned: ${task.project.name} - ${task.title}`,
                    text: `You have been assigned a new task: ${task.title}. Please check the task details at ${origin}/taskDetails?id=${task.id}`,
                    html: `<p>You have been assigned a new task: <strong>${task.title}</strong>.</p><p>Please check the task details <a href="${origin}/taskDetails?id=${task.id}">here</a>.</p>`,
                });
            });

            await step.run('create-new-assignee-notification', async () => {
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
    }
);
