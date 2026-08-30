import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyLogin } from '../controllers/auth/verify.js';
import { prisma } from '../config/prisma.js';
import { redisCache } from '../config/redis.js';
 
vi.mock('../config/prisma.js', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock('../services/eventBus.js', () => ({
    eventBus: { publish: vi.fn() },
}));

describe('2FA Rate-Limiting & Verification Lockout', () => {
    let req, res;

    beforeEach(async () => {
        req = { body: { email: 'user@example.com', code: '123456' } };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        vi.clearAllMocks();
        // Reset Redis key before each test
        await redisCache.del('2fa:fails:user@example.com');
    });

    it('should return 400 when invalid code is submitted and increment failure counter', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'u1',
            email: 'user@example.com',
            twoFactorCode: '654321', // Different code
            twoFactorExpires: new Date(Date.now() + 300000),
        });

        await verifyLogin(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('Invalid verification code'),
                attemptsRemaining: 2,
            })
        );
    });

    it('should lock user out with 429 status after 3 wrong attempts', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'u1',
            email: 'user@example.com',
            twoFactorCode: '654321',
            twoFactorExpires: new Date(Date.now() + 300000),
        });

        // 1st wrong attempt
        await verifyLogin(req, res);
        expect(res.status).toHaveBeenLastCalledWith(400);

        // 2nd wrong attempt
        await verifyLogin(req, res);
        expect(res.status).toHaveBeenLastCalledWith(400);

        // 3rd wrong attempt -> triggers lock
        await verifyLogin(req, res);
        expect(res.status).toHaveBeenLastCalledWith(429);
        expect(res.json).toHaveBeenLastCalledWith(
            expect.objectContaining({
                locked: true,
                retryAfterSeconds: 60,
            })
        );

        // 4th attempt (even with correct code) should remain locked
        req.body.code = '654321';
        await verifyLogin(req, res);
        expect(res.status).toHaveBeenLastCalledWith(429);
    });

    it('should clear lockout counter on successful 2FA verification', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'u1',
            email: 'user@example.com',
            name: 'Test User',
            twoFactorCode: '123456',
            twoFactorExpires: new Date(Date.now() + 300000),
        });
        prisma.user.update.mockResolvedValue({
            id: 'u1',
            email: 'user@example.com',
            name: 'Test User',
        });

        await verifyLogin(req, res);

        expect(res.status).not.toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Logged in successfully',
            })
        );

        const fails = await redisCache.get('2fa:fails:user@example.com');
        expect(fails).toBeNull();
    });
});