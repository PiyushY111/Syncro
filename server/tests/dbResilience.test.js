import { describe, it, expect, vi, afterEach } from 'vitest';
import { isTransientConnectionError, withReadRetry, resolveKeepWarmInterval, startDbKeepWarm } from '../src/config/dbResilience.js';

const dropped = () => Object.assign(new Error('Error in PostgreSQL connection: E57P01 terminating connection due to administrator command'), {});

describe('isTransientConnectionError', () => {
    it('recognises Neon suspend and dropped-connection errors', () => {
        expect(isTransientConnectionError(dropped())).toBe(true);
        expect(isTransientConnectionError({ code: 'P1017', message: 'Server has closed the connection.' })).toBe(true);
        expect(isTransientConnectionError({ code: 'P1001', message: "Can't reach database server" })).toBe(true);
    });

    it('does not treat query errors as transient', () => {
        expect(isTransientConnectionError({ code: 'P2002', message: 'Unique constraint failed' })).toBe(false);
        expect(isTransientConnectionError(null)).toBe(false);
    });
});

describe('withReadRetry', () => {
    it('retries once after a dropped connection and returns the second result', async () => {
        const run = vi.fn().mockRejectedValueOnce(dropped()).mockResolvedValueOnce(['row']);
        const onRetry = vi.fn();
        await expect(withReadRetry(run, { retryDelayMs: 1, onRetry })).resolves.toEqual(['row']);
        expect(run).toHaveBeenCalledTimes(2);
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('does not retry non-connection errors', async () => {
        const err = { code: 'P2025', message: 'Record not found' };
        const run = vi.fn().mockRejectedValue(err);
        await expect(withReadRetry(run, { retryDelayMs: 1 })).rejects.toBe(err);
        expect(run).toHaveBeenCalledTimes(1);
    });

    it('gives up after one retry', async () => {
        const run = vi.fn().mockRejectedValue(dropped());
        await expect(withReadRetry(run, { retryDelayMs: 1 })).rejects.toThrow(/E57P01/);
        expect(run).toHaveBeenCalledTimes(2);
    });
});

describe('resolveKeepWarmInterval', () => {
    it('is on in development and off in production by default', () => {
        expect(resolveKeepWarmInterval({ NODE_ENV: 'development' })).toBe(240_000);
        expect(resolveKeepWarmInterval({ NODE_ENV: 'production' })).toBe(0);
    });

    it('honours the explicit flag and interval, ignoring intervals under 30s', () => {
        expect(resolveKeepWarmInterval({ NODE_ENV: 'production', DB_KEEP_WARM: 'true' })).toBe(240_000);
        expect(resolveKeepWarmInterval({ NODE_ENV: 'development', DB_KEEP_WARM: 'false' })).toBe(0);
        expect(resolveKeepWarmInterval({ DB_KEEP_WARM: 'true', DB_KEEP_WARM_INTERVAL_MS: '60000' })).toBe(60_000);
        expect(resolveKeepWarmInterval({ DB_KEEP_WARM: 'true', DB_KEEP_WARM_INTERVAL_MS: '5' })).toBe(240_000);
    });
});

describe('startDbKeepWarm', () => {
    afterEach(() => vi.useRealTimers());

    it('pings on the interval and logs a failure only once per outage', async () => {
        vi.useFakeTimers();
        const ping = vi.fn().mockRejectedValueOnce(new Error('down')).mockRejectedValueOnce(new Error('down')).mockResolvedValue(1);
        const logger = { warn: vi.fn() };
        const stop = startDbKeepWarm({ ping, intervalMs: 1000, logger });

        await vi.advanceTimersByTimeAsync(3000);
        expect(ping).toHaveBeenCalledTimes(3);
        expect(logger.warn).toHaveBeenCalledTimes(1);

        stop();
        await vi.advanceTimersByTimeAsync(3000);
        expect(ping).toHaveBeenCalledTimes(3);
    });

    it('does nothing when disabled', () => {
        const ping = vi.fn();
        startDbKeepWarm({ ping, intervalMs: 0 })();
        expect(ping).not.toHaveBeenCalled();
    });
});
