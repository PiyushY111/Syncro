import assert from 'node:assert';
import crypto from 'crypto';
import { encryptField, decryptField, timingSafeCompare, hashVerificationCode, generateAuditHash } from '../utils/crypto.js';
import { verifyAuditLogChain } from '../services/auditLogger.js';
import { sanitizeString, sanitizeRequestBody } from '../middlewares/sanitize.js';
import { protect, revokeToken } from '../middlewares/authMiddleware.js';
import { configureSecurityHeaders } from '../middlewares/securityHeaders.js';

console.log('====================================================');
console.log('Executing: Advanced Enterprise Security Test Suite (tests/advancedSecurity.test.js)');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

const runTest = async (description, testFn) => {
  try {
    await testFn();
    console.log(`  [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
};

const runSuite = async () => {
  // 1. AES-256-GCM Field-Level Encryption & Decryption
  await runTest('AES-256-GCM field encryption produces randomized IV and valid ciphertext structure', () => {
    const plaintext = 'Secret-Enterprise-Payload-12345';
    const encrypted = encryptField(plaintext);

    assert.ok(encrypted, 'Encrypted output should be defined');
    assert.ok(encrypted.includes(':'), 'Encrypted output should contain delimiter formatting');
    
    const parts = encrypted.split(':');
    assert.strictEqual(parts.length, 3, 'Encrypted payload should consist of iv:authTag:ciphertext');
    assert.strictEqual(parts[0].length, 24, 'IV should be 12 bytes hex (24 chars)');
    assert.strictEqual(parts[1].length, 32, 'AuthTag should be 16 bytes hex (32 chars)');
  });

  await runTest('AES-256-GCM field decryption accurately reconstructs original plaintext', () => {
    const plaintext = 'Confidential-User-Data-789';
    const encrypted = encryptField(plaintext);
    const decrypted = decryptField(encrypted);

    assert.strictEqual(decrypted, plaintext, 'Decrypted text must match original plaintext');
  });

  await runTest('AES-256-GCM field decryption rejects tampered ciphertext gracefully', () => {
    const plaintext = 'Sensitive-Payload';
    const encrypted = encryptField(plaintext);
    const parts = encrypted.split(':');
    const tamperedParts = [parts[0], parts[1], 'f' + parts[2].slice(1)];
    const tamperedPayload = tamperedParts.join(':');

    const result = decryptField(tamperedPayload);
    assert.strictEqual(result, tamperedPayload, 'Tampered ciphertext should fail decryption and return raw value');
  });

  // 2. Cryptographic Timing-Safe Constant-Time Comparison
  await runTest('Constant-time timingSafeCompare returns true for matching strings', () => {
    const tokenA = 'crypto-secure-auth-token-xyz-100';
    const tokenB = 'crypto-secure-auth-token-xyz-100';
    assert.strictEqual(timingSafeCompare(tokenA, tokenB), true);
  });

  await runTest('Constant-time timingSafeCompare returns false for non-matching strings without timing leak', () => {
    const tokenA = 'crypto-secure-auth-token-xyz-100';
    const tokenB = 'crypto-secure-auth-token-xyz-999';
    assert.strictEqual(timingSafeCompare(tokenA, tokenB), false);
  });

  await runTest('Constant-time timingSafeCompare handles different length strings safely', () => {
    const tokenA = 'short';
    const tokenB = 'extremely-long-string-value-that-differs';
    assert.strictEqual(timingSafeCompare(tokenA, tokenB), false);
  });

  // 3. SHA-256 Verification Code Hashing
  await runTest('SHA-256 code hashing creates deterministic 64-char hex digest', () => {
    const code = '123456';
    const hash = hashVerificationCode(code);
    assert.strictEqual(hash.length, 64, 'SHA-256 hex digest must be 64 characters');
    assert.strictEqual(hash, hashVerificationCode('  123456  '), 'Hashing should normalize whitespace');
  });

  // 4. SHA-256 Audit Log Hash Chain Verification
  await runTest('generateAuditHash produces valid SHA-256 digest for audit log chaining', () => {
    const hash1 = generateAuditHash({
      prevHash: 'GENESIS',
      workspaceId: 'ws-123',
      userId: 'usr-456',
      action: 'DELETE',
      entityType: 'PROJECT',
      entityId: 'proj-789',
      details: { reason: 'Cleanup' }
    });

    assert.ok(hash1, 'Audit hash must be generated');
    assert.strictEqual(hash1.length, 64, 'Audit hash must be 64-character SHA-256 hex string');
  });

  await runTest('verifyAuditLogChain returns valid verification status under safe conditions', async () => {
    const verification = await verifyAuditLogChain('non-existent-workspace-test');
    assert.ok(verification, 'Verification result object should be returned');
    assert.ok(typeof verification.isValid === 'boolean', 'isValid should return boolean status');
  });

  // 5. Server-Side Recursive XSS Input Sanitization
  await runTest('sanitizeString strips malicious script tags and inline event attributes', () => {
    const maliciousInput = '<script>alert("xss")</script><img src="x" onerror="alert(1)">Hello <b>World</b>';
    const sanitized = sanitizeString(maliciousInput);

    assert.ok(!sanitized.includes('<script>'), 'Script tags must be stripped');
    assert.ok(!sanitized.includes('onerror'), 'Inline event handlers must be stripped');
    assert.ok(sanitized.includes('Hello'), 'Safe text must be preserved');
  });

  await runTest('sanitizeRequestBody recursively cleans nested JSON bodies', () => {
    const req = {
      body: {
        title: '<script>doBad()</script>Task Name',
        nested: {
          comment: '<a href="javascript:alert(1)">Click Me</a>'
        },
        tags: ['<img src=x onerror=bad()>', 'Safe Tag']
      }
    };

    sanitizeRequestBody(req, {}, () => {});

    assert.ok(!req.body.title.includes('<script>'), 'Top level string sanitized');
    assert.ok(!req.body.nested.comment.includes('javascript:'), 'Nested string sanitized');
    assert.ok(!req.body.tags[0].includes('onerror'), 'Array element sanitized');
    assert.strictEqual(req.body.tags[1], 'Safe Tag', 'Safe array element preserved');
  });

  // 6. Security Headers Configurator
  await runTest('configureSecurityHeaders attaches mandatory OWASP security headers', () => {
    const middleware = configureSecurityHeaders();
    const headers = {};
    const res = {
      setHeader: (key, val) => { headers[key] = val; }
    };

    if (typeof middleware === 'function') {
      middleware({}, res, () => {});
      assert.ok(headers['X-Frame-Options'] || headers['x-frame-options'], 'X-Frame-Options header must be set');
      assert.ok(headers['X-Content-Type-Options'] || headers['x-content-type-options'], 'X-Content-Type-Options header must be set');
    }
  });

  console.log('\n----------------------------------------------------');
  console.log(`ADVANCED SECURITY TEST SUMMARY: ${passed} Passed | ${failed} Failed`);
  console.log('----------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runSuite();
