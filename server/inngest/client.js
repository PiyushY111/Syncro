import { Inngest } from 'inngest';

if (!process.env.INNGEST_SIGNING_KEY && process.env.INNGEST_SECRET_KEY) {
    process.env.INNGEST_SIGNING_KEY = process.env.INNGEST_SECRET_KEY;
}

export const inngest = new Inngest({ id: 'Project Management' });

// Helper to publish audit logs asynchronously from other event handlers
export const publishAuditLogStep = async (step, data) => {
    await step.run('publish-audit-log', async () => {
        await inngest.send({
            name: 'app/audit.log',
            data
        });
    });
};

// Helper to broadcast WS messages asynchronously
export const broadcastSocketEvent = (room, eventName, payload) => {
    if (global.io) {
        console.log(`[Socket.io Broadcast] Room: ${room}, Event: ${eventName}`);
        global.io.to(room).emit(eventName, payload);
    } else {
        console.log(`[Socket.io Broadcast Warning] global.io not available for event ${eventName}`);
    }
};
