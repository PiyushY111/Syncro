/**
 * Silent session renewal.
 *
 * The access cookie lives 15 minutes; the refresh cookie 7 days. When a request comes back 401 we
 * renew once via /api/auth/refresh and replay the request, so users stay signed in for the full week.
 * Refresh tokens rotate (the old one is revoked), so concurrent 401s must share a single refresh call.
 */

export const AUTH_EXPIRED_EVENT = 'auth:expired';

// Requests whose 401 means "bad credentials", not "session expired" — never refresh for these.
const NO_REFRESH_PATHS = ['/api/auth/refresh', '/api/auth/login', '/api/auth/verify', '/api/auth/register', '/api/auth/logout', '/api/auth/resend-code', '/api/auth/forgot-password', '/api/auth/reset-password'];

/**
 * @param {{ response?: { status?: number }, config?: object }} error axios error
 * @returns {boolean} whether this failure should trigger a refresh-and-replay
 */
export function shouldAttemptRefresh(error) {
    const config = error?.config;
    if (!config || error?.response?.status !== 401 || config._authRetried || config._skipAuthRefresh) return false;
    const url = String(config._originalUrl || config.url || '');
    return !NO_REFRESH_PATHS.some((path) => url.includes(path));
}

/**
 * Wraps a refresh call so simultaneous callers share one in-flight request.
 * @param {() => Promise<unknown>} doRefresh
 * @returns {() => Promise<unknown>}
 */
export function createSingleFlight(doRefresh) {
    let inFlight = null;
    return () => {
        if (!inFlight) {
            inFlight = Promise.resolve()
                .then(doRefresh)
                .finally(() => { inFlight = null; });
        }
        return inFlight;
    };
}
