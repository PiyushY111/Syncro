import { google } from 'googleapis';
import { prisma } from '../config/prisma.js';
import { generateOAuthState } from '../utils/crypto.js';
import logger from '../utils/logger/logger.js';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/google-calendar/callback';

export const createOAuth2Client = () => {
    return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
};

export const getAuthUrl = (userId) => {
    const oauth2Client = createOAuth2Client();
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes,
        state: generateOAuthState(userId)
    });
};

export const exchangeCodeForTokens = async (code) => {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    return {
        tokens,
        email: userInfo.email
    };
};

export const getAuthenticatedCalendarClient = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { googleAccessToken: true, googleRefreshToken: true, googleCalendarSync: true }
    });

    if (!user || !user.googleCalendarSync) {
        logger.info(`[Google Calendar Client] User sync check`, { userId, enabled: Boolean(user?.googleCalendarSync) });
        return null;
    }

    const oauth2Client = createOAuth2Client();

    if (user.googleAccessToken || user.googleRefreshToken) {
        oauth2Client.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken
        });

        oauth2Client.on('tokens', async (tokens) => {
            if (tokens.access_token) {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        googleAccessToken: tokens.access_token,
                        ...(tokens.refresh_token ? { googleRefreshToken: tokens.refresh_token } : {})
                    }
                });
            }
        });

        return google.calendar({ version: 'v3', auth: oauth2Client });
    }

    return null;
};

// Insert Meeting into Google Calendar with Google Meet link & invitations
export const pushMeetingToGoogleCalendar = async ({ userId, meeting, invites = [] }) => {
    try {
        const calendar = await getAuthenticatedCalendarClient(userId);
        if (!calendar) {
            logger.warn('[Google Calendar Push Warning] User is not authenticated or Google Sync is disabled', { userId });
            return null;
        }

        const attendeesMap = new Map();
        if (meeting.creator?.email) {
            attendeesMap.set(meeting.creator.email.toLowerCase(), { email: meeting.creator.email, responseStatus: 'accepted' });
        }

        invites.forEach((inv) => {
            const email = inv.user?.email || inv.email;
            if (email && email.includes('@')) {
                attendeesMap.set(email.toLowerCase(), { email });
            }
        });

        const attendees = Array.from(attendeesMap.values());
        const startTime = new Date(meeting.start_time);
        const endTime = new Date(meeting.end_time);

        const organizerEmail = process.env.ORGANIZER_EMAIL || 'syncro@example.com';
        const requestBody = {
            summary: meeting.title,
            organizer: {
                email: organizerEmail,
                displayName: 'Syncro Platform'
            },
            description: [
                meeting.agenda ? `AGENDA:\n${meeting.agenda}` : '',
                meeting.description ? `NOTES:\n${meeting.description}` : '',
                `Organized by Syncro Platform (${organizerEmail})`
            ].filter(Boolean).join('\n\n'),
            location: meeting.meetingLink || meeting.location || '',
            start: { dateTime: startTime.toISOString() },
            end: { dateTime: endTime.toISOString() },
            attendees: attendees,
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 15 }
                ]
            },
            conferenceData: {
                createRequest: {
                    requestId: `syncro-${meeting.id}-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            }
        };

        let response;
        try {
            response = await calendar.events.insert({
                calendarId: 'primary',
                sendUpdates: 'all',
                conferenceDataVersion: 1,
                requestBody
            });
        } catch (confErr) {
            logger.warn('[Google Calendar Push] Retrying without conferenceData:', { error: confErr.message });
            delete requestBody.conferenceData;
            response = await calendar.events.insert({
                calendarId: 'primary',
                sendUpdates: 'all',
                requestBody
            });
        }

        const googleEventId = response.data.id;
        const meetingLink = response.data.hangoutLink || response.data.htmlLink || null;

        logger.info('[Google Calendar Push Success] Event created on Google Calendar!', { googleEventId, meetingId: meeting.id });
        return { googleEventId, meetingLink };
    } catch (error) {
        logger.error('[Google Calendar SDK Error] Failed to insert event:', { error: error?.response?.data || error.message });
        return null;
    }
};

// Update Meeting in Google Calendar
export const updateMeetingInGoogleCalendar = async ({ userId, meeting, invites = [] }) => {
    if (!meeting.googleEventId) return;
    try {
        const calendar = await getAuthenticatedCalendarClient(userId);
        if (!calendar) return;

        const attendeesMap = new Map();
        if (meeting.creator?.email) {
            attendeesMap.set(meeting.creator.email.toLowerCase(), { email: meeting.creator.email, responseStatus: 'accepted' });
        }

        invites.forEach((inv) => {
            const email = inv.user?.email || inv.email;
            if (email && email.includes('@')) {
                attendeesMap.set(email.toLowerCase(), { email });
            }
        });

        const attendees = Array.from(attendeesMap.values());
        const startTime = new Date(meeting.start_time);
        const endTime = new Date(meeting.end_time);

        const organizerEmail = process.env.ORGANIZER_EMAIL || 'syncro@example.com';
        await calendar.events.update({
            calendarId: 'primary',
            eventId: meeting.googleEventId,
            sendUpdates: 'all',
            requestBody: {
                summary: meeting.title,
                organizer: {
                    email: organizerEmail,
                    displayName: 'Syncro Platform'
                },
                description: [
                    meeting.agenda ? `AGENDA:\n${meeting.agenda}` : '',
                    meeting.description ? `NOTES:\n${meeting.description}` : '',
                    `Organized by Syncro Platform (${organizerEmail})`
                ].filter(Boolean).join('\n\n'),
                location: meeting.meetingLink || meeting.location || '',
                start: { dateTime: startTime.toISOString() },
                end: { dateTime: endTime.toISOString() },
                attendees: attendees
            }
        });
    } catch (error) {
        logger.error('[Google Calendar SDK Error] Failed to update event:', { error: error?.response?.data || error.message });
    }
};

// Delete Meeting from Google Calendar
export const deleteMeetingFromGoogleCalendar = async ({ userId, googleEventId }) => {
    if (!googleEventId) return;
    try {
        const calendar = await getAuthenticatedCalendarClient(userId);
        if (!calendar) return;

        await calendar.events.delete({
            calendarId: 'primary',
            eventId: googleEventId,
            sendUpdates: 'all'
        });
    } catch (error) {
        logger.error('[Google Calendar SDK Error] Failed to delete event:', { error: error?.response?.data || error.message });
    }
};

// Fetch real events from Google Calendar
export const fetchGoogleCalendarEvents = async (userId) => {
    try {
        const calendar = await getAuthenticatedCalendarClient(userId);
        if (!calendar) return [];

        const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin,
            singleEvents: true,
            orderBy: 'startTime'
        });

        return (response.data.items || []).map(item => ({
            id: `gcal-${item.id}`,
            googleEventId: item.id,
            title: `${item.summary || 'Google Calendar Event'} (GCal)`,
            description: item.description || '',
            date: item.start?.dateTime || item.start?.date || new Date().toISOString(),
            start_time: item.start?.dateTime || item.start?.date || new Date().toISOString(),
            end_time: item.end?.dateTime || item.end?.date || new Date().toISOString(),
            location: item.location || item.hangoutLink || '',
            meetingLink: item.hangoutLink || item.htmlLink || '',
            type: 'gcal'
        }));
    } catch (error) {
        logger.error('[Google Calendar SDK Error] Failed to fetch events:', { error: error?.response?.data || error.message });
        return [];
    }
};
