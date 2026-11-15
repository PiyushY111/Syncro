import sendEmail from '../config/nodemailer.js';
import logger from '../utils/logger/logger.js';
import { InternalServerError } from '../utils/errors/appError.js';

const CODE_PURPOSES = {
    login: {
        subject: 'Syncro Login Verification Code',
        action: 'complete your login',
        disclaimer: 'If you did not attempt to sign in to your Syncro account, please ignore this email or change your password.',
    },
    register: {
        subject: 'Syncro Sign Up Verification Code',
        action: 'complete your registration',
        disclaimer: 'If you did not create a Syncro account, please ignore this email.',
    },
};

const buildCodeEmail = (purpose, verificationCode) => {
    const { subject, action, disclaimer } = CODE_PURPOSES[purpose];
    const text = `Your verification code is: ${verificationCode}. It expires in 5 minutes.`;
    const html = `
        <div style="font-family: sans-serif; padding: 24px; max-width: 480px; margin: auto; border: 1px solid #e4e4e7; border-radius: 16px;">
            <h2 style="color: #4f46e5; margin-bottom: 16px;">Syncro Security Code</h2>
            <p>Use the following 6-digit verification code to ${action}. This code is valid for 5 minutes:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px 24px; background-color: #f4f4f5; text-align: center; border-radius: 8px; margin: 20px 0; color: #18181b;">
                ${verificationCode}
            </div>
            <p style="font-size: 12px; color: #71717a;">${disclaimer}</p>
        </div>
    `;
    return { subject, text, html };
};

/**
 * Sends a verification code email synchronously within the request.
 * Auth codes are on the critical path, so they bypass the background queue:
 * a queued job that never runs (unsynced Inngest app, frozen serverless process)
 * would silently leave the user without a code.
 */
export const sendVerificationCodeEmail = async ({ email, verificationCode, purpose = 'login' }) => {
    const message = buildCodeEmail(purpose, verificationCode);
    let result;
    try {
        result = await sendEmail({ to: email, ...message });
    } catch (err) {
        logger.error('[authEmails] Verification email failed', { purpose, email, error: err.message, code: err.code });
        throw new InternalServerError('Could not send verification email. Please try again shortly.');
    }
    if (!result) {
        logger.error('[authEmails] Verification email skipped: email provider not configured', { purpose, email });
        throw new InternalServerError('Email delivery is not configured. Please contact support.');
    }
    logger.info('[authEmails] Verification email sent', { purpose, email });
    return result;
};

export default sendVerificationCodeEmail;
