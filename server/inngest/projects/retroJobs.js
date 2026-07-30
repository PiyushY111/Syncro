import { inngest, broadcastSocketEvent } from '../client.js';

export const retroItemAddedJob = inngest.createFunction(
    { id: 'retro-item-added' },
    { event: 'app/retro.item_added' },
    async ({ event, step }) => {
        const { item, sprintId } = event.data;

        await step.run('websocket-broadcast-retro-add', async () => {
            broadcastSocketEvent(`sprint-${sprintId}`, 'retro:item_added', item);
        });
    }
);

export const retroItemVotedJob = inngest.createFunction(
    { id: 'retro-item-voted' },
    { event: 'app/retro.item_voted' },
    async ({ event, step }) => {
        const { item, sprintId } = event.data;

        await step.run('websocket-broadcast-retro-vote', async () => {
            broadcastSocketEvent(`sprint-${sprintId}`, 'retro:item_voted', item);
        });
    }
);

export const retroItemDeletedJob = inngest.createFunction(
    { id: 'retro-item-deleted' },
    { event: 'app/retro.item_deleted' },
    async ({ event, step }) => {
        const { itemId, sprintId } = event.data;

        await step.run('websocket-broadcast-retro-delete', async () => {
            broadcastSocketEvent(`sprint-${sprintId}`, 'retro:item_deleted', { itemId });
        });
    }
);
