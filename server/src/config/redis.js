import { Redis } from "@upstash/redis";
import logger from "../utils/logger/logger.js";
import { createRedisGuard } from "./redisGuard.js";

const REDIS_CALL_TIMEOUT_MS = Number(process.env.REDIS_CALL_TIMEOUT_MS) || 1500;
const REDIS_COOLDOWN_MS = Number(process.env.REDIS_COOLDOWN_MS) || 30_000;

// One fast failure, then memory fallback for a cooldown window, instead of multi-second stalls per request.
const guard = createRedisGuard({
    timeoutMs: REDIS_CALL_TIMEOUT_MS,
    cooldownMs: REDIS_COOLDOWN_MS,
    onTrip: (err) => logger.warn("[REDIS UNAVAILABLE] Using in-memory fallback temporarily", { error: err.message, cooldownMs: REDIS_COOLDOWN_MS }),
});
const call = (operation) => guard.run(operation);

let redisClient = null;

try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
        redisClient = new Redis({ url, token, retry: { retries: 1, backoff: () => 100 } });
    }
} catch (err) {
    logger.warn("[REDIS WARNING] Upstash Redis initialization failed, falling back to memory.", { error: err.message });
}

// In-memory fallback map if Upstash Redis is unreachable
const memoryStore = new Map();

export const redisCache = {
    get: async (key) => {
        try {
            if (redisClient) return await call(() => redisClient.get(key));
            return memoryStore.get(key) || null;
        } catch (e) {
            return memoryStore.get(key) || null;
        }
    },
    set: async (key, value, exSeconds = 3600) => {
        try {
            if (redisClient) {
                return await call(() => redisClient.set(key, value, { ex: exSeconds }));
            }
            memoryStore.set(key, value);
            return "OK";
        } catch (e) {
            memoryStore.set(key, value);
            return "OK";
        }
    },
    del: async (key) => {
        try {
            if (redisClient) return await call(() => redisClient.del(key));
            memoryStore.delete(key);
            return 1;
        } catch (e) {
            memoryStore.delete(key);
            return 1;
        }
    },
    setNx: async (key, value, exSeconds = 10) => {
        try {
            if (redisClient) {
                const res = await call(() => redisClient.set(key, value, { nx: true, ex: exSeconds }));
                return res === "OK" || res === 1;
            }
            if (memoryStore.has(key)) return false;
            memoryStore.set(key, value);
            setTimeout(() => memoryStore.delete(key), exSeconds * 1000);
            return true;
        } catch (e) {
            if (memoryStore.has(key)) return false;
            memoryStore.set(key, value);
            setTimeout(() => memoryStore.delete(key), exSeconds * 1000);
            return true;
        }
    },
    invalidateCache: async (key) => {
        try {
            await redisCache.del(key);
            await redisCache.publish("cache:invalidate", { key });
        } catch (e) {
            logger.warn("[CACHE INVALIDATION ERROR]", { error: e.message, key });
        }
    },
    incr: async (key) => {
        try {
            if (redisClient) return await call(() => redisClient.incr(key));
        } catch {}
        const val = Number(memoryStore.get(key) || 0) + 1;
        memoryStore.set(key, val);
        return val;
    },
    incrWithTtl: async (key, exSeconds = 60) => {
        try {
            if (redisClient) {
                const val = await call(() => redisClient.incr(key));
                if (val === 1) {
                    await call(() => redisClient.expire(key, exSeconds));
                }
                return val;
            }
        } catch {
            // Guard already logged the outage once; fall through to the in-memory counter.
        }
        const val = Number(memoryStore.get(key) || 0) + 1;
        memoryStore.set(key, val);
        setTimeout(() => memoryStore.delete(key), exSeconds * 1000);
        return val;
    },
    publish: async (channel, message) => {
        try {
            if (redisClient) {
                return await call(() => redisClient.publish(channel, typeof message === 'object' ? JSON.stringify(message) : message));
            }
        } catch {
            // Best effort: cross-instance cache invalidation is skipped while Redis is unavailable.
        }
    }
};

export default redisClient;
