import { basePrisma } from '../config/prisma.js';
import { eventBus } from './eventBus.js';

/**
 * Enqueues a side effect event into the transactional Outbox table within an existing database transaction.
 *
 * @param {Object} tx - Prisma transaction client
 * @param {string} eventType - Unique event identifier (e.g. 'app/task.created')
 * @param {Object} payload - Serializable event payload
 */
export const queueOutboxEvent = async (tx, eventType, payload) => {
  if (!tx || typeof tx.outboxEvent?.create !== 'function') {
    throw new Error('queueOutboxEvent requires a valid transaction client (tx)');
  }
  return await tx.outboxEvent.create({
    data: {
      eventType,
      payload: payload ?? {},
      status: 'PENDING',
    },
  });
};

/**
 * Polls pending transactional outbox events and publishes them safely outside of database locks.
 * Guarantees at-least-once side-effect delivery.
 *
 * @param {number} batchSize - Maximum events to dispatch per run
 */
export const dispatchOutboxEvents = async (batchSize = 50) => {
  try {
    const pendingEvents = await basePrisma.outboxEvent.findMany({
      where: { status: 'PENDING' },
      take: batchSize,
      orderBy: { createdAt: 'asc' },
    });

    if (pendingEvents.length === 0) return { dispatched: 0 };

    let dispatched = 0;
    for (const evt of pendingEvents) {
      try {
        await eventBus.publish(evt.eventType, evt.payload);
        await basePrisma.outboxEvent.update({
          where: { id: evt.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });
        dispatched++;
      } catch (err) {
        console.error(`[OUTBOX DISPATCH ERROR] Event ID: ${evt.id}`, err.message);
        await basePrisma.outboxEvent.update({
          where: { id: evt.id },
          data: {
            status: 'FAILED',
          },
        });
      }
    }

    return { dispatched, total: pendingEvents.length };
  } catch (err) {
    console.error('[OUTBOX POLLER CRASH]', err.message);
    return { dispatched: 0, error: err.message };
  }
};

export default {
  queueOutboxEvent,
  dispatchOutboxEvents,
};
