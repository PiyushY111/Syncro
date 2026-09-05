import crypto from 'crypto';
import express from 'express';
import http from 'http';
import shieldRouter from '../src/routes/shieldRoutes.js';
import shieldEngine from '../src/services/shieldEngine.js';

// Helper to dispatch in-memory request to Express app without opening network sockets
function dispatchInMemory(app, method, path, headers = {}, body = null) {
    return new Promise((resolve) => {
        const req = new http.IncomingMessage();
        req.app = app;
        req.method = method.toUpperCase();
        req.url = path;
        req.socket = { remoteAddress: '127.0.0.1' };
        req.connection = req.socket;
        req.headers = Object.fromEntries(
            Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
        );
        req.headers['content-type'] = req.headers['content-type'] || 'application/json';
        req.body = body;
        req._body = true;
        req.push(null);

        let statusCode = 200;
        let responseHeaders = {};
        let responseData = null;

        const res = new http.ServerResponse(req);
        res.setHeader = (k, v) => { responseHeaders[k.toLowerCase()] = v; };
        res.getHeader = (k) => responseHeaders[k.toLowerCase()];
        res.writeHead = (code, hdrs) => {
            statusCode = code;
            if (hdrs) Object.assign(responseHeaders, hdrs);
        };
        res.status = (code) => { statusCode = code; return res; };
        res.cookie = () => res;
        res.clearCookie = () => res;
        res.json = (data) => {
            statusCode = statusCode || 200;
            responseData = data;
            resolve({ status: statusCode, headers: responseHeaders, data: responseData });
            return res;
        };
        res.send = (data) => {
            statusCode = statusCode || 200;
            try { responseData = JSON.parse(data); } catch { responseData = data; }
            resolve({ status: statusCode, headers: responseHeaders, data: responseData });
            return res;
        };
        res.end = (chunk) => {
            if (chunk && !responseData) {
                try { responseData = JSON.parse(chunk.toString()); } catch { responseData = chunk.toString(); }
            }
            resolve({ status: statusCode, headers: responseHeaders, data: responseData });
        };

        app.handle(req, res);
    });
}

async function runShieldE2ETest() {
    console.log('Starting Syncro Shield End-to-End Cloaked Dispatch Integration Test...\n');
    let passed = 0;
    let failed = 0;

    const assert = (condition, title) => {
        if (condition) {
            console.log(`  [PASS] ${title}`);
            passed++;
        } else {
            console.error(`  [FAIL] ${title}`);
            failed++;
        }
    };

    // 1. Setup minimal test server with Shield and protected dummy routes
    const app = express();
    app.use(express.json());

    // Mount shield router
    app.use('/api/v2/shield', shieldRouter);

    // Dummy protected routes to be dispatched internally
    app.get('/api/v1/confidential/projects', (req, res) => {
        if (req.headers.authorization !== 'Bearer secret-jwt-token') {
            return res.status(401).json({ error: 'Unauthorized Access' });
        }
        res.json({
            status: 'SUCCESS',
            projects: [
                { id: 'p1', name: 'BlackOps Cloaking Project', budget: 500000 },
                { id: 'p2', name: 'Zero-Trust Mesh Network', budget: 1200000 }
            ]
        });
    });

    app.post('/api/v1/confidential/messages', (req, res) => {
        res.status(201).json({
            receivedContent: req.body.content,
            sentBy: req.headers['x-user-id'] || 'anonymous',
            created: true
        });
    });

    try {
        // Step 1: Perform Handshake
        console.log('Step 1: Performing Ephemeral ECDH Key Exchange via /api/v2/shield/handshake...');
        const clientEcdh = crypto.createECDH('prime256v1');
        clientEcdh.generateKeys();
        const clientPubHex = clientEcdh.getPublicKey('hex');

        const hsRes = await dispatchInMemory(app, 'POST', '/api/v2/shield/handshake', {}, { clientPublicKey: clientPubHex });
        assert(hsRes.status === 200, 'Handshake returns HTTP 200 OK');
        const { sessionId, serverPublicKey } = hsRes.data;
        assert(Boolean(sessionId && serverPublicKey), 'Handshake returns sessionId and serverPublicKey');

        // Step 2: Derive client symmetric keys
        const sharedSecret = clientEcdh.computeSecret(serverPublicKey, 'hex');
        const encKey = Buffer.from(
            crypto.hkdfSync('sha256', sharedSecret, '', 'syncro-shield-encryption', 32)
        );
        const authKey = Buffer.from(
            crypto.hkdfSync('sha256', sharedSecret, '', 'syncro-shield-auth', 32)
        );

        // Step 3: Cloak a GET request through POST /api/v2/shield/dispatch
        console.log('Step 2: Sending Cloaked GET Request for confidential internal route...');
        const command1 = {
            method: 'GET',
            endpoint: '/api/v1/confidential/projects',
            params: { filter: 'active' },
            body: null,
            headers: { authorization: 'Bearer secret-jwt-token' },
            timestamp: Date.now(),
            nonce: crypto.randomBytes(16).toString('hex')
        };

        const ciphertext1 = shieldEngine.encryptPayload(command1, encKey);
        const sig1 = crypto.createHmac('sha256', authKey)
            .update(`${sessionId}:${command1.timestamp}:${command1.nonce}:${ciphertext1}`)
            .digest('hex');

        const dispatchRes1 = await dispatchInMemory(app, 'POST', '/api/v2/shield/dispatch', {
            'x-shield-session': sessionId,
            'x-shield-timestamp': String(command1.timestamp),
            'x-shield-nonce': command1.nonce,
            'x-shield-sig': sig1,
            'Content-Type': 'application/json'
        }, { sId: sessionId, c: ciphertext1 });

        assert(dispatchRes1.status === 200, 'Cloaked dispatch returns HTTP 200 OK');
        const envelope1 = dispatchRes1.data;
        assert(Boolean(envelope1.c), 'Response envelope contains encrypted ciphertext only (zero plaintext)');

        // Step 4: Uncloak response on client
        const decryptedRes1 = shieldEngine.decryptPayload(envelope1.c, encKey);
        assert(decryptedRes1.status === 'SUCCESS', 'Decrypted payload matches internal controller output');
        assert(decryptedRes1.projects.length === 2, 'Decrypted project list restored perfectly in volatile memory');
        console.log('');

        // Step 5: Cloak a POST request with body and custom headers
        console.log('Step 3: Sending Cloaked POST Request with encrypted body & headers...');
        const command2 = {
            method: 'POST',
            endpoint: '/api/v1/confidential/messages',
            params: {},
            body: { content: 'Operation DarkStar Initiated' },
            headers: { 'x-user-id': 'agent_007' },
            timestamp: Date.now(),
            nonce: crypto.randomBytes(16).toString('hex')
        };

        const ciphertext2 = shieldEngine.encryptPayload(command2, encKey);
        const sig2 = crypto.createHmac('sha256', authKey)
            .update(`${sessionId}:${command2.timestamp}:${command2.nonce}:${ciphertext2}`)
            .digest('hex');

        const dispatchRes2 = await dispatchInMemory(app, 'POST', '/api/v2/shield/dispatch', {
            'x-shield-session': sessionId,
            'x-shield-timestamp': String(command2.timestamp),
            'x-shield-nonce': command2.nonce,
            'x-shield-sig': sig2,
            'Content-Type': 'application/json'
        }, { sId: sessionId, c: ciphertext2 });

        assert(dispatchRes2.status === 201, 'Internal HTTP 201 status preserved through dispatch');
        const envelope2 = dispatchRes2.data;
        const decryptedRes2 = shieldEngine.decryptPayload(envelope2.c, encKey);
        assert(decryptedRes2.receivedContent === 'Operation DarkStar Initiated', 'Encrypted body correctly parsed by internal route');
        assert(decryptedRes2.sentBy === 'agent_007', 'Encrypted headers accurately unpacked by synthetic request');
        console.log('');

        // Step 6: Security Boundary Verification - Replay attack blocked
        console.log('Step 4: Verifying Anti-Replay Guard rejection...');
        const replayAttempt = await dispatchInMemory(app, 'POST', '/api/v2/shield/dispatch', {
            'x-shield-session': sessionId,
            'x-shield-timestamp': String(command2.timestamp),
            'x-shield-nonce': command2.nonce, // Same nonce re-used!
            'x-shield-sig': sig2,
            'Content-Type': 'application/json'
        }, { sId: sessionId, c: ciphertext2 });
        assert(replayAttempt.status === 403, 'Replayed request immediately blocked with HTTP 403 Forbidden');
        console.log('');

        // Step 7: Security Boundary Verification - Signature forgery blocked
        console.log('Step 5: Verifying HMAC Forgery rejection...');
        const forgedAttempt = await dispatchInMemory(app, 'POST', '/api/v2/shield/dispatch', {
            'x-shield-session': sessionId,
            'x-shield-timestamp': String(Date.now()),
            'x-shield-nonce': crypto.randomBytes(16).toString('hex'),
            'x-shield-sig': 'bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0',
            'Content-Type': 'application/json'
        }, { sId: sessionId, c: ciphertext2 });
        assert(forgedAttempt.status === 403, 'Forged signature immediately blocked with HTTP 403 Forbidden');
        console.log('');

    } catch (err) {
        console.error('Fatal test error:', err);
        failed++;
    }

    console.log('----------------------------------------------------');
    console.log(`SHIELD E2E SUMMARY: ${passed} Passed | ${failed} Failed`);
    console.log('----------------------------------------------------');

    if (failed > 0) process.exit(1);
    process.exit(0);
}

runShieldE2ETest();
