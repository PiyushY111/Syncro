import { inngest } from '../client.js';
import sendEmail from '../../config/nodemailer.js';
import { logAuditEvent } from '../../services/auditLogger.js';

export const auditLogJob = inngest.createFunction(
    { id: 'audit-logger', event: 'app/audit.log' },
    async ({ event }) => {
        const {
            workspaceId,
            userId,
            action,
            entityType,
            entityId,
            entityName,
            severity,
            previousState,
            newState,
            ipAddress,
            userAgent
        } = event.data;

        await logAuditEvent({
            workspaceId,
            userId,
            action,
            entityType,
            entityId,
            entityName,
            severity,
            previousState,
            newState,
            ipAddress,
            userAgent
        });
    }
);

export const authRegisteredJob = inngest.createFunction(
    { id: 'auth-registered', event: 'app/auth.registered', idempotency: 'event.data.email + ":" + event.data.verificationCode' },
    async ({ event, step }) => {
        const { email, verificationCode, isTester } = event.data;
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

        await step.run('send-registered-email', async () => {
            await sendEmail({ to: email, subject, text, html });
        });
    }
);

export const authLoginCodeJob = inngest.createFunction(
    { id: 'auth-login-code', event: 'app/auth.login_code_requested', idempotency: 'event.data.email + ":" + event.data.verificationCode' },
    async ({ event, step }) => {
        const { email, verificationCode, isTester } = event.data;
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
                <p style="font-size: 12px; color: #71717a;">If you did not attempt to sign in to your Syncro account, please ignore this email or change your password.</p>
            </div>
        `;

        await step.run('send-login-email', async () => {
            await sendEmail({ to: email, subject, text, html });
        });
    }
);
