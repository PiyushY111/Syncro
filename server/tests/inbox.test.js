import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getInbox } from '../src/controllers/inbox/getInbox.js';
import { markNotificationRead, markAllNotificationsRead } from '../src/controllers/inbox/markRead.js';
import { archiveNotification } from '../src/controllers/inbox/archiveItem.js';
import { prisma } from '../src/config/prisma.js';
import { redisCache } from '../src/config/redis.js';

vi.mock('../src/config/prisma.js', () => ({
    prisma: {
        notification: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn()
        },
        task: { findMany: vi.fn() },
        meetingInvite: { findMany: vi.fn() }
    }
}));

vi.mock('../src/config/redis.js', () => ({
    redisCache: {
        get: vi.fn(),
        set: vi.fn(),
        incr: vi.fn()
    }
}));

describe('Inbox Caching & Invalidation', () => {
    let req, res;
    beforeEach(() => {
        req = { user: { id: 'u1' }, query: {}, params: {} };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
        vi.clearAllMocks();
    });

    it('should use cached inbox when available', async () => {
        redisCache.get.mockResolvedValueOnce("1"); // version
        redisCache.get.mockResolvedValueOnce(JSON.stringify({ notifications: [], unreadCount: 0 })); // cached data

        await getInbox(req, res);
        expect(res.json).toHaveBeenCalledWith({ notifications: [], unreadCount: 0 });
        expect(prisma.notification.findMany).not.toHaveBeenCalled();
    });

    it('should increment version on markNotificationRead to invalidate cache', async () => {
        req.params.id = 'n1';
        prisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'u1', isRead: false });
        prisma.notification.update.mockResolvedValue({ id: 'n1', isRead: true });

        await markNotificationRead(req, res);
        expect(redisCache.incr).toHaveBeenCalledWith('inbox:version:u1');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should increment version on markAllNotificationsRead to invalidate cache', async () => {
        await markAllNotificationsRead(req, res);
        expect(redisCache.incr).toHaveBeenCalledWith('inbox:version:u1');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should increment version on archiveNotification to invalidate cache', async () => {
        req.params.id = 'n1';
        prisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'u1', isArchived: false });
        prisma.notification.update.mockResolvedValue({ id: 'n1', isArchived: true });

        await archiveNotification(req, res);
        expect(redisCache.incr).toHaveBeenCalledWith('inbox:version:u1');
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
