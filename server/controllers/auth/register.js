import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { eventBus } from '../../services/eventBus.js';

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        
        const isTester = normalizedEmail === 'google-tester@piyushydv.com';
        const verificationCode = isTester ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                passwordHash,
                twoFactorCode: verificationCode,
                twoFactorExpires: expiresAt
            },
        });

        console.log(`[2FA Security Code Sent] User: ${user.email}${isTester ? ' (Bypassed with static code 123456)' : ''}`);

        await eventBus.publish('app/auth.registered', {
            email: user.email,
            verificationCode,
            isTester
        });

        return res.status(201).json({
            requiresVerification: true,
            email: user.email,
            message: 'Verification code sent to your email'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
