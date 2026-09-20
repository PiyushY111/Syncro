import express from 'express';
import {
    getGoogleAuthUrlController,
    googleOAuthCallbackController,
    getRealGoogleCalendarEventsController,
    disconnectGoogleSyncController,
    googleWebhookController
} from '../controllers/googleCalendarController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { verifyCsrfToken } from '../middlewares/csrf.js';

const googleCalendarRouter = express.Router();

// OAuth Authorization & Callbacks
googleCalendarRouter.get('/auth-url', protect, getGoogleAuthUrlController);
googleCalendarRouter.get('/callback', googleOAuthCallbackController);

// Calendar Events & Disconnect
googleCalendarRouter.get('/events', protect, getRealGoogleCalendarEventsController);
googleCalendarRouter.post('/disconnect', protect, verifyCsrfToken, disconnectGoogleSyncController);

// Webhook for 2-Way Sync
googleCalendarRouter.post('/webhook', googleWebhookController);

export default googleCalendarRouter;
