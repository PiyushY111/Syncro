import nodemailer from 'nodemailer';

const user = process.env.SMTP_USERNAME || process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || process.env.SENDER_EMAIL || user;

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

    if (!to || !user || !pass) {
        console.warn('Email not sent: missing SMTP configuration or recipient');
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
