import { EventEmitter } from 'events';
import { inngest } from '../inngest/index.js';

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.fallbackEnabled = process.env.NODE_ENV === 'test' || process.env.DISABLE_INNGEST === 'true';
    }

    /**
     * Publishes a domain event.
     * @param {string} eventName The hierarchical name of the event, e.g. 'task/task.created'
     * @param {object} data The event payload
     */
    async publish(eventName, data = {}) {
        const payload = {
            name: eventName,
            data: {
                ...data,
                timestamp: new Date().toISOString()
            }
        };

        console.log(`[EventBus] Publishing domain event: ${eventName}`);

        // Try to send via Inngest first
        try {
            await inngest.send(payload);
        } catch (inngestError) {
            console.error(`[EventBus] Inngest publish failed for event "${eventName}":`, inngestError.message);
            
            // Fallback: Emit locally so any direct EventEmitter listeners can process it
            this.emit(eventName, data);
        }
    }
}

export const eventBus = new EventBus();
