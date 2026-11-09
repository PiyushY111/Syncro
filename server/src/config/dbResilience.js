/**
 * Neon-friendly database resilience.
 *
 * Neon suspends idle compute (default: after 5 minutes). Suspension kills open pooled connections
 * (Postgres E57P01 "terminating connection due to administrator command"), and the next query pays a
 * cold start plus a reconnect — the multi-second "SLOW DB QUERY" alerts. Two mitigations live here:
 *   1. Retry a read once when it hit a connection that was just dropped (safe: reads are idempotent).
 *   2. An optional keep-warm ping that stops the compute from suspending while the server is running.
 */

const TRANSIENT_PRISMA_CODES = new Set([
    'P1001', // Can't reach database server
    'P1002', // Database server timed out
    'P1017', // Server has closed the connection
])

const TRANSIENT_MESSAGE_PATTERNS = [
    /E57P01/,
    /terminating connection due to administrator command/i,
    /server has closed the connection/i,
    /connection (?:reset|terminated|closed)/i,
    /can't reach database server/i,
]

export const RETRYABLE_READ_OPERATIONS = new Set([
    'findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy',
])

/** True for errors caused by a dropped/unreachable connection rather than by the query itself. */
export function isTransientConnectionError(err) {
    if (!err) return false
    if (err.code && TRANSIENT_PRISMA_CODES.has(err.code)) return true
    const message = String(err.message || '')
    return TRANSIENT_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))
}

/**
 * Run a read, retrying once (after a short pause for the pool to reconnect) on a transient connection error.
 * @template T
 * @param {() => Promise<T>} run
 * @param {{ retryDelayMs?: number, onRetry?: (err: Error) => void }} [options]
 * @returns {Promise<T>}
 */
export async function withReadRetry(run, { retryDelayMs = 250, onRetry } = {}) {
    try {
        return await run()
    } catch (err) {
        if (!isTransientConnectionError(err)) throw err
        if (onRetry) onRetry(err)
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
        return run()
    }
}

/**
 * Keep-warm is on by default in development (where the idle gaps happen) and opt-in elsewhere,
 * because an always-warm compute consumes Neon compute hours.
 * DB_KEEP_WARM=true|false overrides; DB_KEEP_WARM_INTERVAL_MS sets the period (default 4 minutes).
 */
export function resolveKeepWarmInterval(env = process.env) {
    const flag = String(env.DB_KEEP_WARM || '').toLowerCase()
    const enabled = flag ? flag === 'true' || flag === '1' : env.NODE_ENV !== 'production'
    if (!enabled) return 0
    const interval = Number(env.DB_KEEP_WARM_INTERVAL_MS)
    return Number.isFinite(interval) && interval >= 30_000 ? interval : 4 * 60 * 1000
}

/**
 * Ping the database on an interval. Returns a stop function. The timer is unref'd so it never keeps
 * the process alive on its own.
 * @param {{ ping: () => Promise<unknown>, intervalMs: number, logger?: { warn: Function } }} options
 */
export function startDbKeepWarm({ ping, intervalMs, logger }) {
    if (!intervalMs) return () => {}
    let failing = false
    const timer = setInterval(async () => {
        try {
            await ping()
            failing = false
        } catch (err) {
            // Log once per outage, not every tick.
            if (!failing && logger) logger.warn('[DB KEEP-WARM] Ping failed; will keep trying', { error: err.message })
            failing = true
        }
    }, intervalMs)
    if (typeof timer.unref === 'function') timer.unref()
    return () => clearInterval(timer)
}
