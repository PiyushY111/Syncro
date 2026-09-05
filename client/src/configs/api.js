import axios from 'axios';
import shieldSession from '../utils/shieldSession.js';

// In-flight request deduplication store (single-flight cache)
const inFlightRequests = new Map();

// In-memory response cache for SWR
const responseCache = new Map();

// Default Cache TTL: 30 seconds for GET queries
const DEFAULT_CACHE_TTL_MS = 30 * 1000;
// Maximum stale tolerance for SWR background revalidation: 5 minutes
const MAX_STALE_TTL_MS = 5 * 60 * 1000;
// Max retries for transient network failures
const MAX_RETRIES = 2;

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
    timeout: 12000, // 12-second timeout protection against frozen sockets
});

// Helper: Generate a unique signature for deduplication and caching
const getRequestSignature = (url, params, headers) => {
    const serializedParams = params ? JSON.stringify(params) : '';
    const wsId = headers?.['x-workspace-id'] || localStorage.getItem('currentWorkspaceId') || '';
    return `${url}::${serializedParams}::${wsId}`;
};

// Helper: Invalidate cached entries matching patterns
export const invalidateApiCache = (pattern) => {
    if (!pattern) {
        responseCache.clear();
        return;
    }
    for (const key of responseCache.keys()) {
        if (key.includes(pattern)) {
            responseCache.delete(key);
        }
    }
};

// Helper: Determine resource prefix to invalidate on mutations
const getResourcePrefix = (url) => {
    if (!url) return null;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    const parts = cleanUrl.split('?')[0].split('/').filter(Boolean);
    if (parts.length >= 2) {
        return `/${parts[0]}/${parts[1]}`;
    }
    return parts[0] ? `/${parts[0]}` : null;
};

// Request Interceptor: Attach Auth & Workspace Headers & Cloak via Shield Gateway
api.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('pm-auth-token');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    const currentWorkspaceId = localStorage.getItem('currentWorkspaceId');
    if (currentWorkspaceId && !config.headers['x-workspace-id']) {
        config.headers = config.headers || {};
        config.headers['x-workspace-id'] = currentWorkspaceId;
    }

    // Shield Cloaking: Skip if URL is already a shield endpoint or health/ping or opt-out
    const url = config.url || '';
    const isExempt = url.includes('/api/v2/shield') || url === '/health' || url === '/api/ping' || config._skipShield;

    if (!isExempt) {
        try {
            const cloaked = await shieldSession.cloakRequest(
                config.method || 'get',
                config.url,
                config.params,
                config.data,
                config.headers
            );

            config._originalUrl = config.url;
            config._originalMethod = config.method;
            config._originalParams = config.params;

            config.url = cloaked.url;
            config.method = cloaked.method;
            config.params = undefined; // Query params encrypted inside payload
            config.data = cloaked.data;
            config.headers = cloaked.headers;
        } catch (cloakErr) {
            console.warn('[SHIELD CLOAK FAILED - FALLBACK]', cloakErr);
        }
    }

    return config;
});

// Response Interceptor: Invalidate cache on successful mutations & uncloak responses
api.interceptors.response.use(
    async (response) => {
        // Transparently uncloak encrypted response envelopes
        if (response.data && response.data.c) {
            try {
                response.data = await shieldSession.uncloakResponse(response.data);
            } catch (uncloakErr) {
                console.error('[SHIELD UNCLOAK ERROR]', uncloakErr);
            }
        }

        const method = (response.config?._originalMethod || response.config?.method || 'get').toLowerCase();
        if (['post', 'put', 'patch', 'delete'].includes(method)) {
            const url = response.config?._originalUrl || response.config?.url || '';
            const prefix = getResourcePrefix(url);
            if (prefix) {
                invalidateApiCache(prefix);
            }
            // Cross-resource invalidation dependencies:
            if (prefix?.includes('/tasks') || prefix?.includes('/projects')) {
                invalidateApiCache('/api/workspaces');
            }
            if (prefix?.includes('/chat')) {
                invalidateApiCache('/api/chat');
            }
        }
        return response;
    },
    async (error) => {
        const config = error.config;
        if (!config) return Promise.reject(error);

        // Transparently uncloak error payload if encrypted
        if (error.response?.data?.c) {
            try {
                error.response.data = await shieldSession.uncloakResponse(error.response.data);
            } catch {}
        }

        // Automatic session renegotiation if shield session expired or was rejected with 401
        if (error.response?.status === 401 && error.response?.data?.message?.includes('re-handshake')) {
            shieldSession.reset();
            if (config._originalUrl) {
                config.url = config._originalUrl;
                config.method = config._originalMethod;
                config.params = config._originalParams;
            }
            return api(config);
        }

        const method = (config._originalMethod || config.method || 'get').toLowerCase();
        const isIdempotent = method === 'get' || method === 'head' || method === 'options';

        // Check if error is retryable (Network error or 502/503/504 status)
        const isNetworkError = !error.response;
        const isServerError = error.response && [502, 503, 504].includes(error.response.status);

        if (isIdempotent && (isNetworkError || isServerError)) {
            config._retryCount = config._retryCount || 0;
            if (config._retryCount < MAX_RETRIES) {
                config._retryCount += 1;
                const delay = Math.pow(2, config._retryCount) * 200 + Math.floor(Math.random() * 100);
                await new Promise((resolve) => setTimeout(resolve, delay));
                if (config._originalUrl) {
                    config.url = config._originalUrl;
                    config.method = config._originalMethod;
                    config.params = config._originalParams;
                }
                return api(config);
            }
        }

        return Promise.reject(error);
    }
);

// High-Performance Wrapped GET Method with In-Flight Deduplication & SWR Caching
const originalGet = api.get.bind(api);

api.get = function (url, config = {}) {
    const {
        cache = true,
        forceRefresh = false,
        cacheTtl = DEFAULT_CACHE_TTL_MS,
        ...restConfig
    } = config;

    const signature = getRequestSignature(url, restConfig.params, restConfig.headers);
    const now = Date.now();

    // 1. Check in-memory SWR cache
    if (cache && !forceRefresh && responseCache.has(signature)) {
        const cached = responseCache.get(signature);
        const age = now - cached.timestamp;

        // Fresh cache hit: Return immediately in 0ms
        if (age < cached.ttl) {
            return Promise.resolve({ ...cached.response, fromCache: true });
        }

        // Stale cache hit: Return stale data immediately (0ms) and trigger background revalidation
        if (age < MAX_STALE_TTL_MS) {
            // Background revalidation if not already in-flight
            if (!inFlightRequests.has(signature)) {
                const revalPromise = originalGet(url, restConfig)
                    .then((res) => {
                        responseCache.set(signature, {
                            response: res,
                            timestamp: Date.now(),
                            ttl: cacheTtl
                        });
                        return res;
                    })
                    .catch(() => {})
                    .finally(() => {
                        inFlightRequests.delete(signature);
                    });
                inFlightRequests.set(signature, revalPromise);
            }
            return Promise.resolve({ ...cached.response, fromCache: true, isStale: true });
        }
    }

    // 2. Check in-flight requests (deduplication / single-flight)
    if (inFlightRequests.has(signature)) {
        return inFlightRequests.get(signature);
    }

    // 3. Initiate actual network fetch
    const requestPromise = originalGet(url, restConfig)
        .then((response) => {
            if (cache) {
                responseCache.set(signature, {
                    response,
                    timestamp: Date.now(),
                    ttl: cacheTtl
                });
            }
            return response;
        })
        .finally(() => {
            inFlightRequests.delete(signature);
        });

    inFlightRequests.set(signature, requestPromise);
    return requestPromise;
};

// Export cache management methods on the api instance
api.invalidateCache = invalidateApiCache;
api.clearCache = () => responseCache.clear();

export default api;