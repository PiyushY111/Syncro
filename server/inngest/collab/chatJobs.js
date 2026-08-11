import { inngest, broadcastSocketEvent } from '../client.js';
import { prisma } from '../../config/prisma.js';

export const chatMessageSentJob = inngest.createFunction(
    { id: 'chat-message-sent', event: 'app/chat.message_sent' },
    async ({ event, step }) => {
        const { message, channelId, recipientId, senderName } = event.data;

        await step.run('websocket-broadcast-message', async () => {
            if (channelId) {
                broadcastSocketEvent(`channel:${channelId}`, 'message:received', message);
            } else if (recipientId) {
                broadcastSocketEvent(`user:${recipientId}`, 'message:received', message);
                broadcastSocketEvent(`user:${message.userId}`, 'message:received', message);
            }
        });

        if (channelId && message.content) {
            await step.run('parse-mentions-and-notify', async () => {
                const content = message.content;
                const mentionNames = (content.match(/@\S+/g) || [])
                    .map(m => m.slice(1).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toLowerCase())
                    .filter(Boolean);

                if (mentionNames.length === 0) return;

                const chan = await prisma.channel.findUnique({
                    where: { id: channelId },
                    select: { name: true, workspaceId: true }
                });

                if (!chan) return;

                const workspaceMembers = await prisma.workspaceMember.findMany({
                    where: { workspaceId: chan.workspaceId },
                    include: { user: { select: { id: true, name: true } } }
                });

                const mentionedUsers = workspaceMembers
                    .map(m => m.user)
                    .filter(u => {
                        if (!u || u.id === message.userId || !u.name) return false;
                        const userWords = u.name.trim().toLowerCase().split(/\s+/).map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));
                        return mentionNames.some(mention => 
                            userWords.some(word => word === mention || word.startsWith(mention))
                        );
                    });

                for (const u of mentionedUsers) {
                    const notification = await prisma.notification.create({
                        data: {
                            userId: u.id,
                            workspaceId: chan.workspaceId,
                            type: 'COMMENT_MENTION',
                            title: `${senderName} mentioned you in #${chan.name}`,
                            content: content,
                            entityType: 'CHAT',
                            entityId: channelId,
                            priority: 'HIGH'
                        }
                    });

                    broadcastSocketEvent(`user:${u.id}`, 'notification:received', notification);
                }
            });
        }
    }
);

export const chatMessageDeletedJob = inngest.createFunction(
    { id: 'chat-message-deleted', event: 'app/chat.message_deleted' },
    async ({ event, step }) => {
        const { messageId, channelId, recipientId } = event.data;

        await step.run('websocket-broadcast-delete', async () => {
            if (channelId) {
                broadcastSocketEvent(`channel:${channelId}`, 'message:deleted', { messageId });
            } else if (recipientId) {
                broadcastSocketEvent(`user:${recipientId}`, 'message:deleted', { messageId });
            }
        });
    }
);
