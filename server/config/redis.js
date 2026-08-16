import { Redis } from "@upstash/redis";

let redisClient = null;

try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
        redisClient = new Redis({ url, token });
    }
} catch (err) {
    console.warn("[REDIS WARNING] Upstash Redis initialization failed, falling back to memory.", err.message);
}

// In-memory fallback map if Upstash Redis is unreachable
const memoryStore = new Map();

export const redisCache = {
    get: async (key) => {
        try {
            if (redisClient) return await redisClient.get(key);
            return memoryStore.get(key) || null;
        } catch (e) {
            return memoryStore.get(key) || null;
        }
    },
    set: async (key, value, exSeconds = 3600) => {
        try {
            if (redisClient) {
                return await redisClient.set(key, value, { ex: exSeconds });
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
            if (redisClient) return await redisClient.del(key);
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
                const res = await redisClient.set(key, value, { nx: true, ex: exSeconds });
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
            console.warn("[CACHE INVALIDATION ERROR]", e.message);
        }
    },
    incr: async (key) => {
        try {
            if (redisClient) return await redisClient.incr(key);
        } catch {}
        const val = Number(memoryStore.get(key) || 0) + 1;
        memoryStore.set(key, val);
        return val;
    },
    incrWithTtl: async (key, exSeconds = 60) => {
        try {
            if (redisClient) {
                const val = await redisClient.incr(key);
                if (val === 1) {
                    await redisClient.expire(key, exSeconds);
                }
                return val;
            }
        } catch (e) {
            console.error("[REDIS INCR ERROR]", e.message);
        }
        const val = Number(memoryStore.get(key) || 0) + 1;
        memoryStore.set(key, val);
        setTimeout(() => memoryStore.delete(key), exSeconds * 1000);
        return val;
    },
    publish: async (channel, message) => {
        try {
            if (redisClient) {
                return await redisClient.publish(channel, typeof message === 'object' ? JSON.stringify(message) : message);
            }
        } catch (e) {
            console.error("[REDIS PUBLISH ERROR]", e.message);
        }
    }
};

export default redisClient;
