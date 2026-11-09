/**
 * Time-boxes Redis calls and opens a short circuit breaker after a failure, so an unreachable
 * Redis costs one fast failure instead of stalling every request (rate limiter, caches) for seconds.
 */

export class RedisUnavailableError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RedisUnavailableError';
    }
}

/**
 * @param {{ timeoutMs?: number, cooldownMs?: number, now?: () => number, onTrip?: (err: Error) => void }} [options]
 */
export function createRedisGuard({ timeoutMs = 1500, cooldownMs = 30_000, now = Date.now, onTrip } = {}) {
    let openUntil = 0;

    const isOpen = () => now() < openUntil;

    /**
     * Run a Redis operation, or throw RedisUnavailableError immediately while the breaker is open.
     * @template T
     * @param {() => Promise<T>} operation
     * @returns {Promise<T>}
     */
    async function run(operation) {
        if (isOpen()) throw new RedisUnavailableError('Redis temporarily bypassed after a recent failure');

        let timer;
        const timeout = new Promise((_, reject) => {
            timer = setTimeout(() => reject(new RedisUnavailableError(`Redis call exceeded ${timeoutMs}ms`)), timeoutMs);
        });
        try {
            return await Promise.race([operation(), timeout]);
        } catch (err) {
            const wasClosed = !isOpen();
            openUntil = now() + cooldownMs;
            if (wasClosed && onTrip) onTrip(err);
            throw err;
        } finally {
            clearTimeout(timer);
        }
    }

    return { run, isOpen };
}
