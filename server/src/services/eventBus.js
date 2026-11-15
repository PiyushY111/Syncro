import { EventEmitter } from 'events';
import { inngest } from '../inngest/index.js';
import logger from '../utils/logger/logger.js';

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

        logger.info(`[EventBus] Publishing domain event: ${eventName}`, { eventName });

        // Try to send via Inngest first
        try {
            await inngest.send(payload);
        } catch (inngestError) {
            logger.error(`[EventBus] Inngest publish failed for event "${eventName}":`, { error: inngestError.message, eventName });
            
            // Fallback: Emit locally so direct EventEmitter listeners can process it
            this.emit(eventName, data);
        }
    }
}

export const eventBus = new EventBus();

// Auth verification codes are sent synchronously by services/authEmails.js, not via this bus.
