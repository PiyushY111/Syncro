import { prisma } from '../config/prisma.js';
import {
    getAuthUrl,
    exchangeCodeForTokens,
    fetchGoogleCalendarEvents
} from '../services/googleCalendarService.js';
import { verifyOAuthState } from '../utils/crypto.js';

// Get Google OAuth Authorization URL
export const getGoogleAuthUrlController = async (req, res) => {
    try {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_ID.trim()) {
            return res.json({ url: null, configured: false, message: 'GOOGLE_CLIENT_ID is not configured in .env' });
        }
        const userId = req.user.id;
        const url = getAuthUrl(userId);
        return res.json({ url, configured: true });
    } catch (error) {
        console.error('Error generating Google Auth URL:', error);
        return res.status(500).json({ message: 'Failed to generate Google Auth URL' });
    }
};

// Handle Google OAuth Callback
export const googleOAuthCallbackController = async (req, res) => {
    const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0] : 'http://localhost:5173';
    try {
        const { code, state } = req.query;
        if (!code) {
            return res.status(400).send('Authorization code missing');
        }

        const stateCheck = verifyOAuthState(state);
        if (!stateCheck.valid) {
            console.error('[OAuth CSRF / State Tamper Error]', stateCheck.error);
            return res.redirect(`${clientUrl}/calendar?sync=error&reason=invalid_state`);
        }

        const targetUserId = stateCheck.payload.userId;
        const { tokens, email } = await exchangeCodeForTokens(code);

        if (targetUserId) {
            await prisma.user.update({
                where: { id: targetUserId },
                data: {
                    googleCalendarSync: true,
                    googleCalendarEmail: email,
                    googleAccessToken: tokens.access_token,
                    ...(tokens.refresh_token ? { googleRefreshToken: tokens.refresh_token } : {})
                }
            });
        }

        return res.redirect(`${clientUrl}/calendar?sync=success`);
    } catch (error) {
        console.error('Error in Google OAuth Callback:', error);
        return res.redirect(`${clientUrl}/calendar?sync=error`);
    }
};

// Fetch user's Google Calendar events
export const getRealGoogleCalendarEventsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const events = await fetchGoogleCalendarEvents(userId);
        return res.json({ events });
    } catch (error) {
        console.error('Error in getRealGoogleCalendarEventsController:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Disconnect Google Calendar Sync
export const disconnectGoogleSyncController = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                googleCalendarSync: false,
                googleCalendarEmail: null,
                googleAccessToken: null,
                googleRefreshToken: null
            },
            select: {
                id: true,
                email: true,
                name: true,
                googleCalendarSync: true,
                googleCalendarEmail: true
            }
        });

        return res.json({ user, message: 'Google Calendar disconnected successfully' });
    } catch (error) {
        console.error('Error disconnecting Google Sync:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Webhook for 2-Way Push Notifications from Google Calendar
export const googleWebhookController = async (req, res) => {
    try {
        const channelId = req.headers['x-goog-channel-id'];
        const resourceState = req.headers['x-goog-resource-state'];

        console.log(`[Google Webhook Received] Channel: ${channelId}, State: ${resourceState}`);
        // 2-way sync processing logic here
        return res.status(200).send('OK');
    } catch (error) {
        console.error('Error handling Google Webhook:', error);
        return res.status(500).send('Error');
    }
};
