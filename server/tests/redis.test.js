import { describe, it, expect, beforeEach, vi } from 'vitest';
import { redisCache } from '../config/redis.js';

describe('Redis Cache Wrapper & Memory Fallback', () => {
    beforeEach(async () => {
        // Clear keys between tests
        await redisCache.del("k1");
        await redisCache.del("c1");
    });

    it('should set and get values correctly', async () => {
        const setRes = await redisCache.set("k1", "syncro_val", 5);
        expect(setRes).toBe("OK");

        const getRes = await redisCache.get("k1");
        expect(getRes).toBe("syncro_val");
    });

    it('should delete keys successfully', async () => {
        await redisCache.set("k1", "to_delete", 5);
        const delRes = await redisCache.del("k1");
        expect(delRes).toBe(1);

        const getRes = await redisCache.get("k1");
        expect(getRes).toBeNull();
    });

    it('should increment values correctly for versioning', async () => {
        const v1 = await redisCache.incr("c1");
        expect(v1).toBe(1);

        const v2 = await redisCache.incr("c1");
        expect(v2).toBe(2);
    });

    it('should return null for non-existing keys', async () => {
        const val = await redisCache.get("non_existent_key");
        expect(val).toBeNull();
    });
});
