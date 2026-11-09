import { describe, it, expect, vi } from 'vitest';
import { createRedisGuard, RedisUnavailableError } from '../src/config/redisGuard.js';

describe('createRedisGuard', () => {
    it('passes through successful operations', async () => {
        const guard = createRedisGuard();
        await expect(guard.run(async () => 42)).resolves.toBe(42);
        expect(guard.isOpen()).toBe(false);
    });

    it('fails fast when an operation hangs past the timeout', async () => {
        const guard = createRedisGuard({ timeoutMs: 20 });
        const started = Date.now();
        await expect(guard.run(() => new Promise(() => {}))).rejects.toBeInstanceOf(RedisUnavailableError);
        expect(Date.now() - started).toBeLessThan(500);
        expect(guard.isOpen()).toBe(true);
    });

    it('skips Redis entirely during the cooldown, then retries after it', async () => {
        let clock = 1_000;
        const onTrip = vi.fn();
        const guard = createRedisGuard({ cooldownMs: 30_000, now: () => clock, onTrip });

        await expect(guard.run(async () => { throw new Error('fetch failed'); })).rejects.toThrow('fetch failed');
        expect(onTrip).toHaveBeenCalledTimes(1);

        const op = vi.fn(async () => 'ok');
        await expect(guard.run(op)).rejects.toBeInstanceOf(RedisUnavailableError);
        expect(op).not.toHaveBeenCalled();

        clock += 30_001;
        await expect(guard.run(op)).resolves.toBe('ok');
        expect(op).toHaveBeenCalledTimes(1);
    });
});
