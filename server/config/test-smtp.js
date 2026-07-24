import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

const user = process.env.SMTP_USERNAME || process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || process.env.SENDER_EMAIL || user;

console.log('Using SMTP Config:');
console.log('Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
console.log('Port:', process.env.SMTP_PORT || 587);
console.log('Username:', user);
console.log('Password length:', pass ? pass.length : 0);

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
        console.log('Verifying transporter connection...');
        await transporter.verify();
        console.log('Transporter is ready to send emails!');
        
        console.log('Sending test email to:', user);
        const info = await transporter.sendMail({
            from,
            to: user,
            subject: 'Syncro SMTP Test',
            text: 'This is a test email to verify your SMTP settings.',
        });
        console.log('Email sent successfully! MessageId:', info.messageId);
    } catch (error) {
        console.error('SMTP test failed with error:', error);
    }
}

main();
