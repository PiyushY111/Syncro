import { inngest, publishAuditLogStep, broadcastSocketEvent } from '../client.js';
import { prisma } from '../../config/prisma.js';

export const commentCreatedJob = inngest.createFunction(
    { id: 'comment-created' },
    { event: 'app/comment.created' },
    async ({ event, step }) => {
        const { comment, auditContext } = event.data;

        await publishAuditLogStep(step, {
            workspaceId: auditContext.workspaceId,
            userId: auditContext.userId,
            action: 'CREATE',
            entityType: 'TASK',
            entityId: comment.taskId,
            entityName: `Comment on Task: ${comment.task.title}`,
            newState: comment,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent
        });

        await step.run('websocket-broadcast-comment', async () => {
            broadcastSocketEvent(`task:${comment.taskId}`, 'comment:created', comment);
        });

        if (comment.task.assigneeId && comment.task.assigneeId !== comment.userId) {
            await step.run('notify-assignee-new-comment', async () => {
                const notification = await prisma.notification.create({
                    data: {
                        userId: comment.task.assigneeId,
                        workspaceId: auditContext.workspaceId,
                        type: 'COMMENT_MENTION',
                        title: `New Comment on Assigned Task`,
                        content: `${comment.user.name} commented on "${comment.task.title}": ${comment.content}`,
                        entityType: 'TASK',
                        entityId: comment.taskId,
                        priority: 'MEDIUM'
                    }
                });
                broadcastSocketEvent(`user:${comment.task.assigneeId}`, 'notification:received', notification);
            });
        }
    }
);
