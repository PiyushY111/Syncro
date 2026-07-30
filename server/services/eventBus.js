import { EventEmitter } from 'events';
import { inngest } from '../inngest/index.js';

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.fallbackEnabled = process.env.NODE_ENV === 'test' || process.env.DISABLE_INNGEST === 'true';
    }

    /**
     * Publishes a domain event.
     * @param {string} eventName The hierarchical name of the event, e.g. 'task/task.created'
     * @param {object} data The event payload
     */
    async publish(eventName, data = {}) {
        const payload = {
            name: eventName,
            data: {
                ...data,
                timestamp: new Date().toISOString()
            }
        };

        console.log(`[EventBus] Publishing domain event: ${eventName}`);

        // Try to send via Inngest first
        try {
            await inngest.send(payload);
        } catch (inngestError) {
            console.error(`[EventBus] Inngest publish failed for event "${eventName}":`, inngestError.message);
            
            // Fallback: Emit locally so direct EventEmitter listeners can process it
            this.emit(eventName, data);
        }
    }
}

export const eventBus = new EventBus();

// Direct fallback listeners when Inngest is disabled or offline
import sendEmail from '../config/nodemailer.js';

eventBus.on('app/auth.login_code_requested', async (data) => {
    const { email, verificationCode, isTester } = data;
    if (isTester) return;

    const subject = "Syncro Login Verification Code";
    const text = `Your login verification code is: ${verificationCode}. It expires in 5 minutes.`;
    const html = `
        <div style="font-family: sans-serif; padding: 24px; max-width: 480px; margin: auto; border: 1px solid #e4e4e7; border-radius: 16px;">
            <h2 style="color: #4f46e5; margin-bottom: 16px;">Syncro Security Code</h2>
            <p>Use the following 6-digit verification code to complete your login. This code is valid for 5 minutes:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px 24px; background-color: #f4f4f5; text-align: center; border-radius: 8px; margin: 20px 0; color: #18181b;">
                ${verificationCode}
            </div>
            <p style="font-size: 12px; color: #71717a;">If you did not attempt to sign in to your Syncro account, please ignore this email.</p>
        </div>
    `;

    try {
        await sendEmail({ to: email, subject, text, html });
        console.log(`[EventBus Direct Fallback] Verification code email sent to ${email}`);
    } catch (err) {
        console.error('[EventBus Direct Fallback Email Error]', err.message);
    }
});

eventBus.on('app/auth.registered', async (data) => {
    const { email, verificationCode, isTester } = data;
    if (isTester) return;

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

    try {
        await sendEmail({ to: email, subject, text, html });
        console.log(`[EventBus Direct Fallback] Sign-up verification code email sent to ${email}`);
    } catch (err) {
        console.error('[EventBus Direct Fallback Email Error]', err.message);
    }
});

