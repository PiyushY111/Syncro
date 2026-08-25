import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register } from '../controllers/auth/register.js';
import { login } from '../controllers/auth/login.js';
import { prisma } from '../config/prisma.js';

vi.mock('../config/prisma.js', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn()
        }
    }
}));

vi.mock('../services/eventBus.js', () => ({
    eventBus: { publish: vi.fn().mockResolvedValue() }
}));

describe('Auth Controllers', () => {
    let req, res;
    beforeEach(() => {
        req = { body: {} };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            cookie: vi.fn().mockReturnThis(),
        };
        vi.clearAllMocks();
    });

    describe('register', () => {
        it('should return 400 if fields are missing', async () => {
            req.body = { email: 'test@example.com' };
            await register(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 409 if user already exists', async () => {
            req.body = { name: 'Test User', email: 'exist@example.com', password: 'password123' };
            prisma.user.findUnique.mockResolvedValue({ id: '123' });
            await register(req, res);
            expect(res.status).toHaveBeenCalledWith(409);
        });

        it('should register a new user and return 201 with 2FA required', async () => {
            req.body = { name: 'Test User', email: 'new@example.com', password: 'password123' };
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({ email: 'new@example.com' });
            await register(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ requiresVerification: true })
            }));
        });

        it('should bypass 2FA for google-tester@piyushydv.com during registration', async () => {
            req.body = { name: 'Google Tester', email: 'google-tester@piyushydv.com', password: 'password123' };
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({ id: 'tester-1', email: 'google-tester@piyushydv.com', name: 'Google Tester' });
            await register(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.cookie).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ requiresVerification: false })
            }));
        });
    });

    describe('login', () => {
        it('should return 400 if credentials are missing', async () => {
            await login(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should bypass 2FA for google-tester@piyushydv.com during login', async () => {
            const bcrypt = await import('bcryptjs');
            const passwordHash = await bcrypt.default.hash('Password123!', 10);
            req.body = { email: 'google-tester@piyushydv.com', password: 'Password123!' };
            prisma.user.findUnique.mockResolvedValue({
                id: 'tester-1',
                email: 'google-tester@piyushydv.com',
                name: 'Google Tester',
                passwordHash,
            });
            await login(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.cookie).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ requiresVerification: false })
            }));
        });
    });
});
