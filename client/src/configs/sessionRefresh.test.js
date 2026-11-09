import { describe, it, expect, vi } from 'vitest';
import { shouldAttemptRefresh, createSingleFlight } from './sessionRefresh';

const err401 = (config) => ({ response: { status: 401 }, config });

describe('shouldAttemptRefresh', () => {
    it('refreshes on a 401 from a normal API call', () => {
        expect(shouldAttemptRefresh(err401({ url: '/api/workspaces' }))).toBe(true);
        expect(shouldAttemptRefresh(err401({ url: '/api/v2/shield/dispatch', _originalUrl: '/api/auth/me' }))).toBe(true);
    });

    it('never refreshes for auth endpoints, replays, or non-401s', () => {
        expect(shouldAttemptRefresh(err401({ url: '/api/auth/login' }))).toBe(false);
        expect(shouldAttemptRefresh(err401({ url: '/x', _originalUrl: '/api/auth/refresh' }))).toBe(false);
        expect(shouldAttemptRefresh(err401({ url: '/api/tasks', _authRetried: true }))).toBe(false);
        expect(shouldAttemptRefresh({ response: { status: 500 }, config: { url: '/api/tasks' } })).toBe(false);
        expect(shouldAttemptRefresh({ config: { url: '/api/tasks' } })).toBe(false);
    });
});

describe('createSingleFlight', () => {
    it('shares one refresh between concurrent callers, then allows a new one', async () => {
        let resolve;
        const doRefresh = vi.fn(() => new Promise((r) => { resolve = r; }));
        const refresh = createSingleFlight(doRefresh);

        const a = refresh();
        const b = refresh();
        await Promise.resolve();
        resolve('ok');
        await expect(Promise.all([a, b])).resolves.toEqual(['ok', 'ok']);
        expect(doRefresh).toHaveBeenCalledTimes(1);

        refresh();
        await Promise.resolve();
        expect(doRefresh).toHaveBeenCalledTimes(2);
    });

    it('propagates failure to every waiting caller', async () => {
        const refresh = createSingleFlight(() => Promise.reject(new Error('expired')));
        await expect(Promise.all([refresh(), refresh()])).rejects.toThrow('expired');
    });
});
