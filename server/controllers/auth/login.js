import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import sendEmail from '../../config/nodemailer.js';

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

        const subject = "Syncro Login Verification Code";
        const text = `Your login verification code is: ${verificationCode}. It expires in 5 minutes.`;
        const html = `
            <div style="font-family: sans-serif; padding: 24px; max-width: 480px; margin: auto; border: 1px solid #e4e4e7; border-radius: 16px;">
                <h2 style="color: #4f46e5; margin-bottom: 16px;">Syncro Security Code</h2>
                <p>Use the following 6-digit verification code to complete your login. This code is valid for 5 minutes:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px 24px; background-color: #f4f4f5; text-align: center; border-radius: 8px; margin: 20px 0; color: #18181b;">
                    ${verificationCode}
                </div>
                <p style="font-size: 12px; color: #71717a;">If you did not attempt to sign in to your Syncro account, please ignore this email or change your password.</p>
            </div>
        `;

        if (!isTester) {
            sendEmail({ to: user.email, subject, text, html }).catch(err => {
                console.error(`[SMTP ERROR] Failed to send email to ${user.email}:`, err.message);
            });
        }

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
