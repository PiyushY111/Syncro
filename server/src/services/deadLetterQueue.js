import { basePrisma } from '../config/prisma.js';
import { eventBus } from './eventBus.js';

/**
 * Records an exhausted background job failure into the Dead-Letter Queue table.
 */
export const recordFailedJob = async ({ jobId, eventName, payload, error }) => {
  try {
    const record = await basePrisma.failedJob.create({
      data: {
        jobId: jobId || 'unknown',
        eventName: eventName || 'unknown',
        payload: payload ?? {},
        error: typeof error === 'string' ? error : error?.message || JSON.stringify(error),
      },
    });
    console.warn(`[DEAD LETTER QUEUE] Recorded failed job ${jobId} (${eventName})`);
    return record;
  } catch (err) {
    console.error('[DLQ RECORD ERROR]', err.message);
  }
};

/**
 * Replays a failed job by re-emitting its original event payload to the event bus.
 */
export const replayFailedJob = async (failedJobId) => {
  const job = await basePrisma.failedJob.findUnique({
    where: { id: failedJobId },
  });

  if (!job) {
    throw new Error(`Failed job record ${failedJobId} not found`);
  }

  await eventBus.publish(job.eventName, job.payload);

  await basePrisma.failedJob.update({
    where: { id: failedJobId },
    data: { isResolved: true },
  });

  return { success: true, replayedJobId: failedJobId, eventName: job.eventName };
};

export default {
  recordFailedJob,
  replayFailedJob,
};
