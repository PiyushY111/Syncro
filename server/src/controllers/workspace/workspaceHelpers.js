import crypto from 'node:crypto';

const inviteSecret = process.env.JWT_SECRET || 'development-secret';
const inviteTokenTtlMs = Number(process.env.INVITE_TTL_MS || 1000 * 60 * 60 * 24 * 7);

const base64UrlEncode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

export const signInviteToken = (payload) => crypto.createHmac('sha256', inviteSecret).update(payload).digest('base64url');

export const createInvitationToken = (payload) => {
    const encodedPayload = base64UrlEncode(payload);
    const signature = signInviteToken(encodedPayload);
    return `${encodedPayload}.${signature}`;
};

export const verifyInvitationToken = (token) => {
    if (!token) return null;

    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature) return null;

    const expectedSignature = signInviteToken(encodedPayload);

    if (expectedSignature.length !== signature.length) return null;

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;

    try {
        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));

        if (payload.expiresAt && Date.now() > payload.expiresAt) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
};

export const createWorkspaceSlug = (name) =>
    `${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${crypto.randomBytes(4).toString('hex')}`;

export const getInviteTokenTtlMs = () => inviteTokenTtlMs;
