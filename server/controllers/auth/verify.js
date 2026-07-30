import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import { eventBus } from '../../services/eventBus.js';

const sanitizeUser = (user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image || '',
    googleCalendarSync: user.googleCalendarSync,
    googleCalendarEmail: user.googleCalendarEmail,
    starredChannelIds: user.starredChannelIds || [],
    createdAt: user.createdAt,
});

const createToken = (user) =>
    jwt.sign(
        { userId: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET || 'development-secret',
        { expiresIn: '7d' }
    );

export const verifyLogin = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ message: 'Email and verification code are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.twoFactorCode || !user.twoFactorExpires) {
            return res.status(400).json({ message: 'No active login session. Please login again.' });
        }

        if (user.twoFactorCode !== code.trim()) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        if (new Date() > new Date(user.twoFactorExpires)) {
            return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorCode: null,
                twoFactorExpires: null
            }
        });

        return res.json({
            message: 'Logged in successfully',
            token: createToken(updatedUser),
            user: sanitizeUser(updatedUser),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const resendCode = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isTester = normalizedEmail === 'google-tester@piyushydv.com';
        const verificationCode = isTester ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorCode: verificationCode,
                twoFactorExpires: expiresAt
            }
        });

        console.log(`[2FA Security Code Sent] User: ${user.email}${isTester ? ' (Bypassed with static code 123456)' : ''}`);

        await eventBus.publish('app/auth.login_code_requested', {
            email: user.email,
            verificationCode,
            isTester
        });

        return res.json({ message: 'Verification code resent successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
