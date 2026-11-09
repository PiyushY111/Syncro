import nodemailer from 'nodemailer';
import logger from '../utils/logger/logger.js';

const DEFAULT_SMTP_PORT = 587;

// Read env at send time, not import time, so module load order can never capture undefined values.
const getSmtpConfig = () => {
    const user = process.env.SMTP_USERNAME || process.env.SMTP_USER;
    // Google displays app passwords as "abcd efgh ijkl mnop"; the spaces are not part of the password.
    const pass = (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '').replace(/\s+/g, '') || undefined;
    return {
        user,
        pass,
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || DEFAULT_SMTP_PORT),
        from: process.env.SMTP_FROM || process.env.SENDER_EMAIL || user || 'onboarding@resend.dev',
    };
};

let cachedTransporter = null;
let cachedTransportKey = '';

const getTransporter = ({ host, port, user, pass }) => {
    const key = `${host}:${port}:${user}:${pass}`;
    if (!cachedTransporter || cachedTransportKey !== key) {
        cachedTransporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // implicit TLS on 465, STARTTLS otherwise
            auth: { user, pass },
        });
        cachedTransportKey = key;
    }
    return cachedTransporter;
};

const sendEmail = async (toOrObj, subject, text, html) => {
    let to, finalSubject, finalText, finalHtml;

    if (typeof toOrObj === 'object' && toOrObj !== null && !Array.isArray(toOrObj)) {
        to = toOrObj.to;
        finalSubject = toOrObj.subject;
        finalText = toOrObj.text;
        finalHtml = toOrObj.html;
    } else {
        to = toOrObj;
        finalSubject = subject;
        finalText = text;
        finalHtml = html;
    }

    if (!to) {
        logger.warn('Email not sent: missing recipient');
        return null;
    }

    // Option A: Send via Resend HTTP API (Bypasses Render SMTP port block!)
    if (process.env.RESEND_API_KEY) {
        try {
            const resendFrom = process.env.SMTP_FROM || 'onboarding@resend.dev';
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: resendFrom,
                    to: [to],
                    subject: finalSubject,
                    text: finalText,
                    html: finalHtml,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Resend API error');
            }
            logger.info('Email sent via Resend API successfully!', { messageId: data.id, to });
            return data;
        } catch (error) {
            logger.error('Failed to send email via Resend API:', { error: error.message, to });
            // Fall back to SMTP attempt
        }
    }

    // Option B: Fallback to SMTP
    const smtp = getSmtpConfig();
    if (!smtp.user || !smtp.pass) {
        logger.warn('Email not sent: missing SMTP configuration (set SMTP_USERNAME and SMTP_PASSWORD)');
        return null;
    }

    const response = await getTransporter(smtp).sendMail({
        from: smtp.from,
        to,
        subject: finalSubject,
        text: finalText,
        html: finalHtml,
    });
    return response;
};

export default sendEmail;
