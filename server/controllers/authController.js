import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import sendEmail from '../config/nodemailer.js';

const sanitizeUser = (user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image || '',
    createdAt: user.createdAt,
});

const createToken = (user) =>
    jwt.sign(
        { userId: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET || 'development-secret',
        { expiresIn: '7d' }
    );

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
        
        // Generate 6-digit verification code
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

        // Send Email asynchronously (non-blocking)
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

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorCode: verificationCode,
                twoFactorExpires: expiresAt
            }
        });

        console.log(`[2FA Security Code Sent] User: ${user.email}`);

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

        // Send Email asynchronously (non-blocking)
        sendEmail({ to: user.email, subject, text, html }).catch(err => {
            console.error(`[SMTP ERROR] Failed to send email to ${user.email}:`, err.message);
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

        // Clear code on success
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

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorCode: verificationCode,
                twoFactorExpires: expiresAt
            }
        });

        console.log(`[2FA Security Code Sent] User: ${user.email}`);

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

        // Send Email asynchronously (non-blocking)
        sendEmail({ to: user.email, subject, text, html }).catch(err => {
            console.error(`[SMTP ERROR] Failed to resend email to ${user.email}:`, err.message);
        });

        return res.json({ message: 'Verification code resent successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const me = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({ user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, image } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name.trim(),
                image: image ? image.trim() : "",
            },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                createdAt: true,
            },
        });

        return res.json({ user, message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || !user.passwordHash) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid current password' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        return res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};