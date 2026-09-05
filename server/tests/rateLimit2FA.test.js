import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyLogin } from '../src/controllers/auth/verify.js';
import { prisma } from '../src/config/prisma.js';
import { redisCache } from '../src/config/redis.js';
import { hashVerificationCode } from '../src/utils/crypto.js';
 
vi.mock('../src/config/prisma.js', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        userSession: {
            create: vi.fn().mockResolvedValue({}),
        },
    },
}));

vi.mock('../src/services/eventBus.js', () => ({
    eventBus: { publish: vi.fn() },
}));

describe('2FA Rate-Limiting & Verification Lockout', () => {
    let req, res;

    beforeEach(async () => {
        req = { body: { email: 'user@example.com', code: '987654' }, headers: {}, socket: {}, cookies: {} };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            cookie: vi.fn().mockReturnThis(),
        };
        vi.clearAllMocks();
        // Reset Redis key before each test
        await redisCache.del('2fa:fails:user@example.com');
    });

    it('should throw BadRequestError when invalid code is submitted and increment failure counter', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'u1',
            email: 'user@example.com',
            twoFactorCode: hashVerificationCode('112233'), // Stored hashed code
            twoFactorExpires: new Date(Date.now() + 300000),
        });

        await expect(verifyLogin(req, res)).rejects.toMatchObject({
            statusCode: 400,
            details: { attemptsRemaining: 2 }
        });
    });

    it('should lock user out with 429 status after 3 wrong attempts', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'u1',
            email: 'user@example.com',
            twoFactorCode: hashVerificationCode('112233'),
            twoFactorExpires: new Date(Date.now() + 300000),
        });

        // 1st wrong attempt
        await expect(verifyLogin(req, res)).rejects.toMatchObject({ statusCode: 400 });

        // 2nd wrong attempt
        await expect(verifyLogin(req, res)).rejects.toMatchObject({ statusCode: 400 });

        // 3rd wrong attempt -> triggers lock (429)
        await expect(verifyLogin(req, res)).rejects.toMatchObject({
            statusCode: 429,
            details: expect.objectContaining({ locked: true, retryAfterSeconds: 60 })
        });

        // 4th attempt (even with correct code) should remain locked
        req.body.code = '112233';
        await expect(verifyLogin(req, res)).rejects.toMatchObject({
            statusCode: 429
        });
    });

    it('should clear lockout counter on successful 2FA verification', async () => {
        const correctCode = '654321';
        req.body.code = correctCode;
        prisma.user.findUnique.mockResolvedValue({
            id: 'u1',
            email: 'user@example.com',
            name: 'Test User',
            twoFactorCode: hashVerificationCode(correctCode),
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