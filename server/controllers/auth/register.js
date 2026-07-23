import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import sendEmail from '../../config/nodemailer.js';

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
        
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
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

        console.log(`[2FA Security Code Sent] User: ${user.email}`);

        const subject = "Syncro Sign Up Verification Code";
        const text = `Your sign up verification code is: ${verificationCode}. It expires in 5 minutes.`;
        const html = `
            <div style="font-family: sans-serif; padding: 24px; max-width: 480px; margin: auto; border: 1px solid #e4e4e7; border-radius: 16px;">
                <h2 style="color: #4f46e5; margin-bottom: 16px;">Syncro Security Code</h2>
                <p>Use the following 6-digit verification code to complete your registration. This code is valid for 5 minutes:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px 24px; background-color: #f4f4f5; text-align: center; border-radius: 8px; margin: 20px 0; color: #18181b;">
                    ${verificationCode}
                </div>
                <p style="font-size: 12px; color: #71717a;">If you did not create a Syncro account, please ignore this email.</p>
            </div>
        `;
        sendEmail({ to: user.email, subject, text, html }).catch(err => {
            console.error(`[SMTP ERROR] Failed to send email to ${user.email}:`, err.message);
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
