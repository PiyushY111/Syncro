/**
 * Syncro Shield Session Manager (Client)
 * Manages volatile memory ECDH session keys, handshake orchestration,
 * and transparent request/response cloaking.
 */

import {
    generateECDHKeyPair,
    exportPublicKeyHex,
    deriveSessionKeys,
    encryptShieldPayload,
    decryptShieldPayload,
    generateHmacSignature,
    generateRandomHex
} from './shieldCrypto';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5001';

const sanitizeHeaders = (hdrs) => {
    if (!hdrs) return {};
    const raw = typeof hdrs.toJSON === 'function' ? hdrs.toJSON() : hdrs;
    const result = {};
    for (const [k, v] of Object.entries(raw)) {
        if (v !== undefined && v !== null && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
            result[k.toLowerCase()] = String(v);
        }
    }
    return result;
};

const HANDSHAKE_TIMEOUT_MS = 3500;
const HANDSHAKE_COOLDOWN_MS = 5000;

class ShieldSessionManager {
    constructor() {
        this.sessionId = null;
        this.encKey = null;
        this.authKey = null;
        this.handshakePromise = null;
        this.isHandshaking = false;
        this.lastHandshakeFailure = 0;
    }

    /**
     * Resets the active session, forcing a fresh key exchange on next request.
     */
    reset() {
        this.sessionId = null;
        this.encKey = null;
        this.authKey = null;
        this.handshakePromise = null;
        this.isHandshaking = false;
    }

    /**
     * Ensures an active, authenticated cryptographic session exists with the server.
     * Uses volatile memory keys only (never written to disk).
     */
    async getSession() {
        if (this.sessionId && this.encKey && this.authKey) {
            return {
                sessionId: this.sessionId,
                encKey: this.encKey,
                authKey: this.authKey
            };
        }

        // If a handshake recently failed, respect cooldown to prevent blocking requests
        if (Date.now() - this.lastHandshakeFailure < HANDSHAKE_COOLDOWN_MS) {
            throw new Error('Shield handshake in temporary cooldown after failure');
        }

        if (this.handshakePromise) {
            return await this.handshakePromise;
        }

        this.handshakePromise = this._performHandshake();
        try {
            return await this.handshakePromise;
        } finally {
            this.handshakePromise = null;
        }
    }

    async _performHandshake() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), HANDSHAKE_TIMEOUT_MS);

        try {
            // 1. Generate client ephemeral ECDH P-256 keypair
            const clientKeyPair = await generateECDHKeyPair();
            const clientPubHex = await exportPublicKeyHex(clientKeyPair.publicKey);

            // 2. Exchange public keys with server
            const res = await fetch(`${BASE_URL}/api/v2/shield/handshake`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientPublicKey: clientPubHex }),
                signal: controller.signal
            });

            if (!res.ok) {
                throw new Error(`Shield handshake failed with HTTP ${res.status}`);
            }

            const data = await res.json();
            const { sessionId, serverPublicKey } = data;

            if (!sessionId || !serverPublicKey) {
                throw new Error('Malformed shield handshake response from server');
            }

            // 3. Derive symmetric session keys (K_enc, K_auth)
            const { encKey, authKey } = await deriveSessionKeys(
                clientKeyPair.privateKey,
                serverPublicKey
            );

            this.sessionId = sessionId;
            this.encKey = encKey;
            this.authKey = authKey;
            this.lastHandshakeFailure = 0;

            return {
                sessionId,
                encKey,
                authKey
            };
        } catch (err) {
            this.lastHandshakeFailure = Date.now();
            this.reset();
            throw err;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Cloaks an outgoing HTTP request into an opaque encrypted payload
     * routed to POST /api/v2/shield/dispatch.
     */
    async cloakRequest(originalMethod, originalUrl, params, body, extraHeaders = {}) {
        const { sessionId, encKey, authKey } = await this.getSession();

        const timestamp = Date.now();
        const nonce = generateRandomHex(16);
        const cleanHeaders = sanitizeHeaders(extraHeaders);

        const commandPayload = {
            method: (originalMethod || 'GET').toUpperCase(),
            endpoint: originalUrl,
            params: params || {},
            body: body || null,
            headers: cleanHeaders,
            timestamp,
            nonce
        };

        // Encrypt the command payload with AES-256-GCM + noise jitter padding
        const ciphertext = await encryptShieldPayload(commandPayload, encKey);

        // Sign the session, timestamp, nonce, and ciphertext with HMAC-SHA256
        const signaturePayload = `${sessionId}:${timestamp}:${nonce}:${ciphertext}`;
        const signature = await generateHmacSignature(signaturePayload, authKey);

        return {
            url: '/api/v2/shield/dispatch',
            method: 'POST',
            headers: {
                'x-shield-session': sessionId,
                'x-shield-timestamp': String(timestamp),
                'x-shield-nonce': nonce,
                'x-shield-sig': signature,
                'Content-Type': 'application/json'
            },
            data: {
                sId: sessionId,
                c: ciphertext
            }
        };
    }

    /**
     * Uncloaks an incoming encrypted response envelope from /api/v2/shield/dispatch.
     */
    async uncloakResponse(responseData) {
        if (!responseData || typeof responseData !== 'object') {
            return responseData;
        }

        // Check if response is a shield ciphertext envelope
        if (responseData.c && typeof responseData.c === 'string') {
            const { encKey } = await this.getSession();
            const decrypted = await decryptShieldPayload(responseData.c, encKey);
            return decrypted;
        }

        return responseData;
    }
}

export const shieldSession = new ShieldSessionManager();
export default shieldSession;
