import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getChannelMessages } from '../controllers/chat/getMessages.js';
import { prisma } from '../config/prisma.js';
import { redisCache } from '../config/redis.js';

vi.mock('../config/prisma.js', () => ({
    prisma: {
        channel: { findUnique: vi.fn() },
        message: { findMany: vi.fn() }
    }
}));

vi.mock('../config/redis.js', () => ({
    redisCache: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue("OK")
    }
}));

describe('Chat Message Caching & Retrieval', () => {
    let req, res;
    beforeEach(() => {
        req = { user: { id: 'u1' }, params: { channelId: 'c1' } };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
        vi.clearAllMocks();
    });

    it('should return 404 if channel not found', async () => {
        prisma.channel.findUnique.mockResolvedValue(null);
        await getChannelMessages(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should use cached messages if available', async () => {
        prisma.channel.findUnique.mockResolvedValue({
            id: 'c1',
            creatorId: 'u1',
            members: [],
            workspace: { members: [] }
        });
        redisCache.get.mockResolvedValue(JSON.stringify([{ id: 'm1', content: 'hello' }]));

        await getChannelMessages(req, res);
        expect(res.json).toHaveBeenCalledWith({
            messages: [{ id: 'm1', content: 'hello' }],
            fromCache: true
        });
        expect(prisma.message.findMany).not.toHaveBeenCalled();
    });

    it('should query DB and set cache if cache is empty', async () => {
        prisma.channel.findUnique.mockResolvedValue({
            id: 'c1',
            creatorId: 'u1',
            members: [],
            workspace: { members: [] }
        });
        redisCache.get.mockResolvedValue(null);
        prisma.message.findMany.mockResolvedValue([{ id: 'm1', content: 'db message' }]);

        await getChannelMessages(req, res);
        expect(prisma.message.findMany).toHaveBeenCalled();
        expect(redisCache.set).toHaveBeenCalledWith(
            'messages:c1',
            JSON.stringify([{ id: 'm1', content: 'db message' }]),
            300
        );
        expect(res.json).toHaveBeenCalledWith({
            messages: [{ id: 'm1', content: 'db message' }],
            fromCache: false
        });
    });
});
