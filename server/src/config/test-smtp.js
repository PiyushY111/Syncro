import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';
import logger from '../utils/logger/logger.js';

const user = process.env.SMTP_USERNAME || process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || process.env.SENDER_EMAIL || user;

logger.info('Using SMTP Config:', {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    username: user,
    hasPassword: Boolean(pass)
});

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
        user,
        pass,
    },
});

async function main() {
    try {
        logger.info('Verifying transporter connection...');
        await transporter.verify();
        logger.info('Transporter is ready to send emails!');
        
        logger.info('Sending test email to recipient', { recipient: user });
        const info = await transporter.sendMail({
            from,
            to: user,
            subject: 'Syncro SMTP Test',
            text: 'This is a test email to verify your SMTP settings.',
        });
        logger.info('Email sent successfully!', { messageId: info.messageId });
    } catch (error) {
        logger.error('SMTP test failed with error:', { error: error.message });
    }
}

main();
