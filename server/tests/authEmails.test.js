import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/config/nodemailer.js', () => ({ default: vi.fn() }));

const { default: sendEmail } = await import('../src/config/nodemailer.js');
const { sendVerificationCodeEmail } = await import('../src/services/authEmails.js');
const { InternalServerError } = await import('../src/utils/errors/appError.js');

describe('sendVerificationCodeEmail', () => {
    beforeEach(() => {
        sendEmail.mockReset();
    });

    it('sends the code to the user and resolves with the provider result', async () => {
        sendEmail.mockResolvedValue({ messageId: 'abc' });
        const result = await sendVerificationCodeEmail({ email: 'a@b.dev', verificationCode: '123456', purpose: 'register' });
        expect(result).toEqual({ messageId: 'abc' });
        const sent = sendEmail.mock.calls[0][0];
        expect(sent.to).toBe('a@b.dev');
        expect(sent.subject).toBe('Syncro Sign Up Verification Code');
        expect(sent.html).toContain('123456');
    });

    it('throws when the SMTP provider rejects the message', async () => {
        sendEmail.mockRejectedValue(new Error('Invalid login'));
        await expect(sendVerificationCodeEmail({ email: 'a@b.dev', verificationCode: '1' })).rejects.toThrow(InternalServerError);
    });

    it('throws when no email provider is configured', async () => {
        sendEmail.mockResolvedValue(null);
        await expect(sendVerificationCodeEmail({ email: 'a@b.dev', verificationCode: '1' })).rejects.toThrow(InternalServerError);
    });
});
