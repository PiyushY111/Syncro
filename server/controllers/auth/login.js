import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { eventBus } from '../../services/eventBus.js';

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (!user || !user.passwordHash) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isTester = normalizedEmail === 'google-tester@piyushydv.com';
        const verificationCode = isTester ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

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

        return res.json({
            requiresVerification: true,
            email: user.email,
            message: "Verification code sent to your email"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
