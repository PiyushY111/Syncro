import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register } from '../controllers/auth/register.js';
import { login } from '../controllers/auth/login.js';
import { prisma } from '../config/prisma.js';
import { BadRequestError, ConflictError } from '../utils/errors/appError.js';

vi.mock('../config/prisma.js', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn()
        },
        platformSetting: {
            findUnique: vi.fn().mockResolvedValue(null)
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
        it('should return 400 (throw BadRequestError) if fields are missing', async () => {
            req.body = { email: 'test@example.com' };
            await expect(register(req, res)).rejects.toThrow(BadRequestError);
        });

        it('should return 409 (throw ConflictError) if user already exists', async () => {
            req.body = { name: 'Test User', email: 'exist@example.com', password: 'password123' };
            prisma.user.findUnique.mockResolvedValue({ id: '123' });
            await expect(register(req, res)).rejects.toThrow(ConflictError);
        });

        it('should register a new user and return 201 with 2FA required', async () => {
            req.body = { name: 'Test User', email: 'new@example.com', password: 'password123' };
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({ id: 'u-new', email: 'new@example.com' });
            await register(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ requiresVerification: true })
            }));
        });

        it('should require 2FA during registration even for tester email', async () => {
            req.body = { name: 'Test User', email: 'user@example.com', password: 'password123' };
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({ id: 'user-1', email: 'user@example.com', name: 'Test User' });
            await register(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ requiresVerification: true })
            }));
        });
    });

    describe('login', () => {
        it('should return 400 (throw BadRequestError) if credentials are missing', async () => {
            await expect(login(req, res)).rejects.toThrow(BadRequestError);
        });

        it('should require 2FA code during login with valid password', async () => {
            const bcrypt = await import('bcryptjs');
            const passwordHash = await bcrypt.default.hash('Password123!', 10);
            req.body = { email: 'user@example.com', password: 'Password123!' };
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                email: 'user@example.com',
                name: 'Test User',
                passwordHash,
            });
            prisma.user.update.mockResolvedValue({});
            await login(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ requiresVerification: true })
            }));
        });
    });
});
