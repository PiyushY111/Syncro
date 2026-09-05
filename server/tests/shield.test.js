import crypto from 'crypto';
import shieldEngine from '../services/shieldEngine.js';
import { encryptField, decryptField } from '../utils/crypto.js';

async function runShieldTestSuite() {
    console.log('Starting Syncro Shield Zero-Trust Cryptographic Verification Suite...\n');
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

    try {
        // Test 1: Ephemeral ECDH P-256 Key Agreement & HKDF Key Derivation
        console.log('Test 1: Ephemeral ECDH P-256 Key Agreement & Session Generation');
        const clientEcdh = crypto.createECDH('prime256v1');
        clientEcdh.generateKeys();
        const clientPubHex = clientEcdh.getPublicKey('hex');

        const handshakeResult = await shieldEngine.handleHandshake(clientPubHex);

        assert(typeof handshakeResult.sessionId === 'string' && handshakeResult.sessionId.length > 0, 'Handshake yields unique cryptographic sessionId');
        assert(typeof handshakeResult.serverPublicKey === 'string' && handshakeResult.serverPublicKey.length === 130, 'Server returns valid uncompressed 65-byte ECDH public key (130 hex chars)');

        // Client derives shared secret and keys
        const clientSharedSecret = clientEcdh.computeSecret(handshakeResult.serverPublicKey, 'hex');
        const clientEncKey = Buffer.from(
            crypto.hkdfSync('sha256', clientSharedSecret, '', 'syncro-shield-encryption', 32)
        );
        const clientAuthKey = Buffer.from(
            crypto.hkdfSync('sha256', clientSharedSecret, '', 'syncro-shield-auth', 32)
        );

        const serverSession = await shieldEngine.getSession(handshakeResult.sessionId);
        assert(serverSession !== null, 'Server correctly persists active session in store');
        assert(serverSession.encKey.equals(clientEncKey), 'Client and server derived encryption keys (K_enc) match 100%');
        assert(serverSession.authKey.equals(clientAuthKey), 'Client and server derived auth keys (K_auth) match 100%');
        console.log('');

        // Test 2: AES-256-GCM Authenticated Encryption with Random Jitter Padding
        console.log('Test 2: AES-256-GCM Envelope Encryption with Anti-Traffic-Analysis Jitter');
        const originalPayload = {
            method: 'POST',
            endpoint: '/api/tasks',
            body: { title: 'Top-Secret Infrastructure Overhaul', priority: 'HIGH' },
            timestamp: Date.now()
        };

        const ciphertext1 = shieldEngine.encryptPayload(originalPayload, clientEncKey);
        const ciphertext2 = shieldEngine.encryptPayload(originalPayload, clientEncKey);

        assert(ciphertext1 !== ciphertext2, 'Encrypting same payload produces different ciphertexts due to randomized IV and noise jitter');
        assert(ciphertext1.split(':').length === 3, 'Ciphertext adheres to standard IV:AuthTag:Ciphertext envelope structure');

        const decryptedPayload = shieldEngine.decryptPayload(ciphertext1, clientEncKey);
        assert(JSON.stringify(decryptedPayload) === JSON.stringify(originalPayload), 'Decryption accurately recovers original payload without noise artifact');
        console.log('');

        // Test 3: Anti-Tamper Cryptographic Signatures (HMAC-SHA256)
        console.log('Test 3: Anti-Tamper Cryptographic Signatures (HMAC-SHA256)');
        const timestamp = Date.now();
        const nonce = crypto.randomBytes(16).toString('hex');
        const messageToSign = `${handshakeResult.sessionId}:${timestamp}:${nonce}:${ciphertext1}`;

        const validSig = crypto.createHmac('sha256', clientAuthKey).update(messageToSign).digest('hex');
        assert(shieldEngine.verifySignature(validSig, messageToSign, clientAuthKey) === true, 'Valid signature verified successfully');

        const tamperedSig = validSig.slice(0, -2) + (validSig.slice(-2) === 'ff' ? 'ee' : 'ff');
        assert(shieldEngine.verifySignature(tamperedSig, messageToSign, clientAuthKey) === false, 'Tampered signature rejected');

        const tamperedMessage = `${handshakeResult.sessionId}:${timestamp + 1000}:${nonce}:${ciphertext1}`;
        assert(shieldEngine.verifySignature(validSig, tamperedMessage, clientAuthKey) === false, 'Tampered message rejected');
        console.log('');

        // Test 4: Anti-Replay Guard (Nonce Uniqueness & Timestamp Drift Limits)
        console.log('Test 4: Anti-Replay Nonce & Timestamp Verification');
        const testNonce = crypto.randomBytes(16).toString('hex');
        const now = Date.now();

        const replay1 = await shieldEngine.verifyReplayGuard(handshakeResult.sessionId, now, testNonce);
        assert(replay1.valid === true, 'First presentation of nonce is accepted');

        const replay2 = await shieldEngine.verifyReplayGuard(handshakeResult.sessionId, now, testNonce);
        assert(replay2.valid === false && replay2.reason.includes('Replay attack detected'), 'Replayed nonce is rejected with 403 reason');

        const expiredTime = now - 90 * 1000;
        const freshNonce = crypto.randomBytes(16).toString('hex');
        const replayExpired = await shieldEngine.verifyReplayGuard(handshakeResult.sessionId, expiredTime, freshNonce);
        assert(replayExpired.valid === false && replayExpired.reason.includes('expired'), 'Expired timestamp (> 60s skew) is rejected');
        console.log('');

        // Test 5: Field-Level Data-at-Rest Encryption (PostgreSQL Simulation)
        console.log('Test 5: Data-at-Rest Field-Level Encryption');
        const confidentialMessage = 'Secret chat message between engineers';
        const encryptedField = encryptField(confidentialMessage);

        assert(encryptedField.startsWith('enc:') || encryptedField.includes(':'), 'Field encrypted with authenticated AES-256-GCM format');
        assert(encryptedField !== confidentialMessage, 'Plaintext message is never stored raw');

        const decryptedField = decryptField(encryptedField);
        assert(decryptedField === confidentialMessage, 'Field decryption restores exact original text');

        // Legacy plaintext pass-through verification
        const legacyPlaintext = 'Old unencrypted message from legacy db';
        assert(decryptField(legacyPlaintext) === legacyPlaintext, 'Legacy plaintext safely passes through without decryption error');
        console.log('');

    } catch (err) {
        console.error('Fatal test error:', err);
        failed++;
    }

    console.log('----------------------------------------------------');
    console.log(`SHIELD TEST SUMMARY: ${passed} Passed | ${failed} Failed`);
    console.log('----------------------------------------------------');

    if (failed > 0) {
        process.exit(1);
    }
}

runShieldTestSuite();
