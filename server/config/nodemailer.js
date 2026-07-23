import nodemailer from 'nodemailer';

const user = process.env.SMTP_USERNAME || process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || process.env.SENDER_EMAIL || user || 'onboarding@resend.dev';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // true for 465, false for other ports
    auth: {
        user,
        pass,
    },
});

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
        console.warn('Email not sent: missing recipient');
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
            console.log('Email sent via Resend API successfully! MessageId:', data.id);
            return data;
        } catch (error) {
            console.error('Failed to send email via Resend API:', error.message);
            // Fall back to SMTP attempt
        }
    }

    // Option B: Fallback to SMTP
    if (!user || !pass) {
        console.warn('Email not sent: missing SMTP configuration');
        return null;
    }

    const response = await transporter.sendMail({
        from,
        to,
        subject: finalSubject,
        text: finalText,
        html: finalHtml,
    });
    return response;
};

export default sendEmail;
