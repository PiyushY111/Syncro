/**
 * Syncro Shield Cryptographic Engine (Server)
 * Enterprise-grade ECDH P-256 key agreement, HKDF-SHA256,
 * AES-256-GCM authenticated encryption with jitter padding,
 * and HMAC-SHA256 anti-tamper / anti-replay verification.
 */

import crypto from 'crypto';
import { redisCache } from '../config/redis.js';
import logger from '../utils/logger/logger.js';

const SESSION_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const NONCE_TTL_SECONDS = 90; // 90 seconds
const MAX_CLOCK_SKEW_MS = 60 * 1000; // 60 seconds

// Memory fallback store for sessions and nonces if Redis is unreachable
const memorySessions = new Map();
const memoryNonces = new Set();

// Periodic cleanup of expired in-memory sessions every 15 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [id, session] of memorySessions.entries()) {
        if (now - session.createdAt > SESSION_TTL_SECONDS * 1000) {
            memorySessions.delete(id);
        }
    }
}, 15 * 60 * 1000).unref();

export const shieldEngine = {
    /**
     * Completes ECDH P-256 key exchange with client and generates derived session keys.
     *
     * @param {string} clientPublicKeyHex - Client uncompressed raw ECDH public key
     * @returns {Promise<{ sessionId: string, serverPublicKey: string }>}
     */
    async handleHandshake(clientPublicKeyHex) {
        if (!clientPublicKeyHex || typeof clientPublicKeyHex !== 'string') {
            throw new Error('Invalid client public key');
        }

        // 1. Generate ephemeral server ECDH P-256 keypair
        const serverEcdh = crypto.createECDH('prime256v1');
        serverEcdh.generateKeys();
        const serverPublicKey = serverEcdh.getPublicKey('hex');

        // 2. Compute 256-bit Diffie-Hellman shared secret
        const sharedSecret = serverEcdh.computeSecret(clientPublicKeyHex, 'hex');

        // 3. Derive symmetric session keys via HKDF-SHA256
        const encKey = Buffer.from(
            crypto.hkdfSync('sha256', sharedSecret, '', 'syncro-shield-encryption', 32)
        );
        const authKey = Buffer.from(
            crypto.hkdfSync('sha256', sharedSecret, '', 'syncro-shield-auth', 32)
        );

        // 4. Generate random session ID
        const sessionId = crypto.randomUUID();

        const sessionRecord = {
            sessionId,
            encKeyHex: encKey.toString('hex'),
            authKeyHex: authKey.toString('hex'),
            createdAt: Date.now()
        };

        // 5. Store session with TTL in Redis (or memory fallback)
        try {
            await redisCache.set(
                `shield:session:${sessionId}`,
                JSON.stringify(sessionRecord),
                SESSION_TTL_SECONDS
            );
        } catch (err) {
            logger.warn('[SHIELD WARN] Redis unavailable for session store, falling back to in-memory store:', { error: err.message, sessionId });
            memorySessions.set(sessionId, sessionRecord);
        }

        return {
            sessionId,
            serverPublicKey
        };
    },

    /**
     * Retrieves an active shield session by sessionId.
     */
    async getSession(sessionId) {
        if (!sessionId) return null;

        try {
            const cached = await redisCache.get(`shield:session:${sessionId}`);
            if (cached) {
                const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
                return {
                    sessionId: parsed.sessionId,
                    encKey: Buffer.from(parsed.encKeyHex, 'hex'),
                    authKey: Buffer.from(parsed.authKeyHex, 'hex')
                };
            }
        } catch (err) {
            logger.warn('[SHIELD WARN] Redis read failed while fetching session, falling back to in-memory store:', { error: err.message });
        }

        if (memorySessions.has(sessionId)) {
            const mem = memorySessions.get(sessionId);
            return {
                sessionId: mem.sessionId,
                encKey: Buffer.from(mem.encKeyHex, 'hex'),
                authKey: Buffer.from(mem.authKeyHex, 'hex')
            };
        }

        return null;
    },

    /**
     * Verifies request timestamp and guards against replay attacks using nonces.
     * Uses atomic SETNX with TTL in Redis to eliminate TOCTOU replay windows.
     */
    async verifyReplayGuard(sessionId, timestamp, nonce) {
        const now = Date.now();
        const reqTime = Number(timestamp);

        if (isNaN(reqTime) || Math.abs(now - reqTime) > MAX_CLOCK_SKEW_MS) {
            return { valid: false, reason: 'Request timestamp expired or out of allowed clock skew' };
        }

        if (!nonce || typeof nonce !== 'string' || nonce.length < 16) {
            return { valid: false, reason: 'Missing or invalid cryptographic nonce' };
        }

        const nonceKey = `shield:nonce:${sessionId}:${nonce}`;

        try {
            // Atomic check and set with TTL in Redis
            const acquired = await redisCache.setNx(nonceKey, '1', NONCE_TTL_SECONDS);
            if (!acquired) {
                return { valid: false, reason: 'Replay attack detected: duplicate nonce' };
            }
        } catch (err) {
            logger.warn('[SHIELD WARN] Redis unavailable for nonce verification, using in-memory guard:', { error: err.message, sessionId });
            if (memoryNonces.has(nonceKey)) {
                return { valid: false, reason: 'Replay attack detected: duplicate nonce' };
            }
            memoryNonces.add(nonceKey);
            setTimeout(() => memoryNonces.delete(nonceKey), NONCE_TTL_SECONDS * 1000);
        }

        return { valid: true };
    },

    /**
     * Verifies HMAC-SHA256 signature using timing-safe comparison.
     */
    verifySignature(signatureHex, expectedMessage, authKey) {
        if (!signatureHex || typeof signatureHex !== 'string') return false;

        const expectedSig = crypto
            .createHmac('sha256', authKey)
            .update(expectedMessage)
            .digest('hex');

        if (signatureHex.length !== expectedSig.length) return false;

        try {
            return crypto.timingSafeEqual(
                Buffer.from(signatureHex, 'hex'),
                Buffer.from(expectedSig, 'hex')
            );
        } catch {
            return false;
        }
    },

    /**
     * Encrypts payload with AES-256-GCM and variable random noise jitter padding.
     */
    encryptPayload(data, encKey) {
        const iv = crypto.randomBytes(12);

        // Add 32 to 96 bytes of random noise padding to prevent packet length analysis
        const paddingLength = Math.floor(Math.random() * 64) + 32;
        const noise = crypto.randomBytes(paddingLength).toString('hex');

        const envelopeObj = {
            d: data,
            _n: noise
        };

        const cipher = crypto.createCipheriv('aes-256-gcm', encKey, iv);
        let encrypted = cipher.update(JSON.stringify(envelopeObj), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    },

    /**
     * Decrypts AES-256-GCM envelope and validates authentication tag.
     */
    decryptPayload(envelopeStr, encKey) {
        if (!envelopeStr || typeof envelopeStr !== 'string') {
            throw new Error('Invalid shield envelope format');
        }

        const parts = envelopeStr.split(':');
        if (parts.length !== 3) {
            throw new Error('Malformed shield envelope parts');
        }

        const [ivHex, tagHex, cipherHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(tagHex, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-gcm', encKey, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        const parsed = JSON.parse(decrypted);
        return parsed.d !== undefined ? parsed.d : parsed;
    }
};

export default shieldEngine;
