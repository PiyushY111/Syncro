/**
 * Syncro Shield Unified Cloaked Gateway Router
 * Endpoints:
 * - POST /api/v2/shield/handshake
 * - POST /api/v2/shield/dispatch
 */

import express from 'express';
import http from 'http';
import { shieldEngine } from '../services/shieldEngine.js';
import { apiLimiter, authLimiter } from '../middlewares/rateLimiter.js';
import logger from '../utils/logger/logger.js';

const router = express.Router();

const FORBIDDEN_OVERRIDE_HEADERS = new Set([
    'host', 'x-forwarded-for', 'x-real-ip', 'connection', 'transfer-encoding', 'content-length'
]);

/**
 * Ephemeral ECDH P-256 Key Exchange
 */
router.post('/handshake', authLimiter, async (req, res) => {
    try {
        const { clientPublicKey } = req.body;
        if (!clientPublicKey) {
            return res.status(400).json({ message: 'clientPublicKey is required' });
        }

        const result = await shieldEngine.handleHandshake(clientPublicKey);
        return res.status(200).json(result);
    } catch (err) {
        logger.error('[SHIELD HANDSHAKE ERROR]', { error: err.message, requestId: req.headers['x-request-id'] });
        return res.status(500).json({ message: 'Shield handshake failed' });
    }
});

/**
 * Unified Cloaked Dispatcher
 * Transparently verifies HMAC signatures, enforces replay protection,
 * decrypts the incoming command, dispatches internally, and encrypts the response.
 */
router.post('/dispatch', apiLimiter, async (req, res) => {
    try {
        const sessionId = req.headers['x-shield-session'];
        const timestamp = req.headers['x-shield-timestamp'];
        const nonce = req.headers['x-shield-nonce'];
        const signature = req.headers['x-shield-sig'];
        const ciphertext = req.body?.c;

        if (!sessionId || !timestamp || !nonce || !signature || !ciphertext) {
            return res.status(400).json({ message: 'Missing shield security headers or payload' });
        }

        // 1. Retrieve active session
        const session = await shieldEngine.getSession(sessionId);
        if (!session) {
            return res.status(401).json({ message: 'Shield session expired or invalid. Please re-handshake.' });
        }

        // 2. Anti-Replay Guard (Nonce uniqueness + timestamp window)
        const replayCheck = await shieldEngine.verifyReplayGuard(sessionId, timestamp, nonce);
        if (!replayCheck.valid) {
            return res.status(403).json({ message: replayCheck.reason });
        }

        // 3. Cryptographic Signature Verification
        const expectedMessage = `${sessionId}:${timestamp}:${nonce}:${ciphertext}`;
        const isValidSignature = shieldEngine.verifySignature(signature, expectedMessage, session.authKey);
        if (!isValidSignature) {
            return res.status(403).json({ message: 'Cryptographic signature mismatch. Request untrusted.' });
        }

        // 4. Decrypt Command Payload
        let command;
        try {
            command = shieldEngine.decryptPayload(ciphertext, session.encKey);
        } catch (decErr) {
            logger.error('[SHIELD DECRYPTION ERROR]', { error: decErr.message, sessionId, requestId: req.headers['x-request-id'] });
            return res.status(400).json({ message: 'Ciphertext decryption or authentication tag verification failed.' });
        }

        const targetMethod = (command.method || 'GET').toUpperCase();
        const targetEndpoint = command.endpoint || '/';
        const targetParams = command.params || {};
        const targetBody = command.body || null;
        const extraHeaders = command.headers || {};

        // Security Validation: Endpoint allowlist & recursion prevention
        if (
            !targetEndpoint.startsWith('/api/') ||
            targetEndpoint.startsWith('/api/v2/shield') ||
            targetEndpoint.startsWith('/metrics') ||
            targetEndpoint.startsWith('/health')
        ) {
            return res.status(400).json({ message: 'Invalid or restricted shield dispatch target endpoint' });
        }

        // 5. Dispatch internally via Express pipeline (0ms in-memory execution)
        const dispatchResult = await new Promise((resolve) => {
            const syntheticReq = new http.IncomingMessage();
            syntheticReq.app = req.app;
            syntheticReq.method = targetMethod;

            // Merge query parameters if present
            const queryEntries = Object.entries(targetParams);
            const queryString = queryEntries.length > 0
                ? (targetEndpoint.includes('?') ? '&' : '?') + new URLSearchParams(targetParams).toString()
                : '';

            syntheticReq.url = targetEndpoint + queryString;

            // Sanitize extraHeaders to prevent sensitive header overrides
            const sanitizedExtra = {};
            for (const [k, v] of Object.entries(extraHeaders)) {
                if (!FORBIDDEN_OVERRIDE_HEADERS.has(k.toLowerCase())) {
                    sanitizedExtra[k] = v;
                }
            }

            // Real request headers take precedence over client-supplied headers
            const mergedHeaders = {
                ...sanitizedExtra,
                ...req.headers,
                host: req.headers.host || 'localhost'
            };
            delete mergedHeaders['x-shield-sig'];
            delete mergedHeaders['x-shield-nonce'];
            delete mergedHeaders['x-shield-session'];
            delete mergedHeaders['x-shield-timestamp'];
            delete mergedHeaders['content-length'];
            delete mergedHeaders['transfer-encoding'];

            syntheticReq.headers = Object.fromEntries(
                Object.entries(mergedHeaders).map(([k, v]) => [k.toLowerCase(), v])
            );
            syntheticReq.headers['content-type'] = 'application/json';
            syntheticReq.body = targetBody;
            syntheticReq._body = true; // Signals express.json() / body-parser that body is already parsed
            syntheticReq.push(null);   // Closes readable stream so no middleware waits for socket chunks
            syntheticReq.socket = req.socket;
            syntheticReq.connection = req.connection || req.socket;
            syntheticReq.cookies = req.cookies || {};
            syntheticReq.signedCookies = req.signedCookies || {};
            syntheticReq.protocol = req.protocol || 'http';
            syntheticReq.secure = req.secure || false;
            syntheticReq.ip = req.ip;
            syntheticReq.ips = req.ips;

            let statusCode = 200;
            let responseHeaders = {};
            let responseData = null;
            let isResolved = false;

            const timer = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    resolve({
                        status: 504,
                        headers: responseHeaders,
                        data: { message: 'Shield internal dispatch gateway timeout' }
                    });
                }
            }, 10000);

            const finishDispatch = (status, headers, data) => {
                if (isResolved) return;
                isResolved = true;
                clearTimeout(timer);
                resolve({ status: status || 200, headers, data });
            };

            const syntheticRes = new http.ServerResponse(syntheticReq);
            syntheticRes.setHeader = (k, v) => { responseHeaders[k.toLowerCase()] = v; };
            syntheticRes.getHeader = (k) => responseHeaders[k.toLowerCase()];
            syntheticRes.writeHead = (code, hdrs) => {
                statusCode = code;
                if (hdrs) Object.assign(responseHeaders, hdrs);
            };
            syntheticRes.status = (code) => { statusCode = code; return syntheticRes; };
            syntheticRes.cookie = (name, val, options) => {
                res.cookie(name, val, options);
                return syntheticRes;
            };
            syntheticRes.clearCookie = (name, options) => {
                res.clearCookie(name, options);
                return syntheticRes;
            };
            syntheticRes.sendStatus = (code) => {
                statusCode = code;
                finishDispatch(statusCode, responseHeaders, { status: code });
                return syntheticRes;
            };
            syntheticRes.redirect = (url) => {
                statusCode = 302;
                responseHeaders['location'] = url;
                finishDispatch(statusCode, responseHeaders, { redirect: url });
                return syntheticRes;
            };
            syntheticRes.json = (data) => {
                statusCode = statusCode || 200;
                responseData = data;
                finishDispatch(statusCode, responseHeaders, responseData);
                return syntheticRes;
            };
            syntheticRes.send = (data) => {
                statusCode = statusCode || 200;
                if (typeof data === 'object') {
                    responseData = data;
                } else {
                    try {
                        responseData = JSON.parse(data);
                    } catch {
                        responseData = data;
                    }
                }
                finishDispatch(statusCode, responseHeaders, responseData);
                return syntheticRes;
            };
            syntheticRes.end = (chunk) => {
                if (chunk && !responseData) {
                    try {
                        responseData = JSON.parse(chunk.toString());
                    } catch {
                        responseData = chunk.toString();
                    }
                }
                finishDispatch(statusCode || 200, responseHeaders, responseData);
            };

            req.app.handle(syntheticReq, syntheticRes);
        });

        // 6. Encrypt Controller Response with AES-256-GCM + noise jitter padding
        const encryptedResponse = shieldEngine.encryptPayload(dispatchResult.data, session.encKey);

        return res.status(dispatchResult.status || 200).json({
            sId: sessionId,
            c: encryptedResponse
        });
    } catch (err) {
        logger.error('[SHIELD DISPATCH ERROR]', { error: err.message, requestId: req.headers['x-request-id'] });
        return res.status(500).json({ message: 'Internal shield dispatch error' });
    }
});

export default router;
