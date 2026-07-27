import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';

export const me = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                googleCalendarSync: true,
                googleCalendarEmail: true,
                starredChannelIds: true,
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
                googleCalendarSync: true,
                googleCalendarEmail: true,
                starredChannelIds: true,
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

export const updateGoogleSync = async (req, res) => {
    try {
        const userId = req.user.id;
        const { googleCalendarSync, googleCalendarEmail, googleAccessToken, googleRefreshToken } = req.body;

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                googleCalendarSync: !!googleCalendarSync,
                googleCalendarEmail: googleCalendarEmail !== undefined ? (googleCalendarEmail?.trim() || null) : undefined,
                googleAccessToken: googleAccessToken !== undefined ? (googleAccessToken || null) : undefined,
                googleRefreshToken: googleRefreshToken !== undefined ? (googleRefreshToken || null) : undefined,
            },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                googleCalendarSync: true,
                googleCalendarEmail: true,
                googleAccessToken: true,
                googleRefreshToken: true,
                createdAt: true,
            },
        });

        return res.json({ user, message: 'Google Calendar sync updated successfully' });
    } catch (error) {
        console.error('Error in updateGoogleSync:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
