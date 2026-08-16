import { encryptField, decryptField, timingSafeCompare, hashVerificationCode } from '../utils/crypto.js';
import { sanitizeString } from '../middlewares/sanitize.js';
import { validateRegister } from '../validators/authValidators.js';

async function runSecurityTestSuite() {
  console.log('🛡️ Starting Enterprise Security & Cryptographic Verification Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      failed++;
    }
  };

  try {
    // Test 1: AES-256-GCM Field-Level Encryption & Decryption
    console.log('Test 1: AES-256-GCM Field-Level Encryption');
    const secretText = 'ya29.a0Axoo-google-oauth-secret-token';
    const encrypted = encryptField(secretText);
    const decrypted = decryptField(encrypted);

    assert(encrypted !== secretText, 'Field encryption converts plaintext to ciphertext');
    assert(encrypted.split(':').length === 3, 'Ciphertext includes randomized IV, authTag, and ciphertext payload');
    assert(decrypted === secretText, 'Field decryption accurately reconstructs original plaintext');
    console.log('');

    // Test 2: Timing-Safe String Comparison
    console.log('Test 2: Constant-Time Timing-Safe Comparison');
    assert(timingSafeCompare('123456', '123456') === true, 'Matching strings return true');
    assert(timingSafeCompare('123456', '654321') === false, 'Non-matching strings return false');
    assert(timingSafeCompare('123456', '123') === false, 'Strings of different length safely evaluate to false without timing leak');
    console.log('');

    // Test 3: SHA-256 2FA Code Hashing
    console.log('Test 3: Cryptographic 2FA Code Hashing');
    const rawCode = '849201';
    const hash1 = hashVerificationCode(rawCode);
    const hash2 = hashVerificationCode(' 849201 ');

    assert(hash1.length === 64, 'SHA-256 hash yields 64-character hex string');
    assert(hash1 === hash2, 'Code hashing trims whitespace predictably');
    console.log('');

    // Test 4: Server-Side XSS HTML Sanitization
    console.log('Test 4: Server-Side XSS Input Sanitization');
    const maliciousPayload = '<script>alert("XSS")</script><p>Clean Text <a href="javascript:void(0)" onclick="steal()">Link</a></p>';
    const sanitized = sanitizeString(maliciousPayload);

    assert(!sanitized.includes('<script>'), 'Sanitizer strips <script> execution tags');
    assert(!sanitized.includes('onclick'), 'Sanitizer strips malicious event handler attributes');
    assert(sanitized.includes('<p>Clean Text'), 'Sanitizer preserves safe HTML markup tags');
    console.log('');

    // Test 5: NIST Password Complexity Enforcement
    console.log('Test 5: Password Complexity Policy');
    const weakPassReq = { body: { name: 'Alice', email: 'alice@example.com', password: 'simple' } };
    const strongPassReq = { body: { name: 'Alice', email: 'alice@example.com', password: 'SecurePassword123!' } };

    const weakErr = validateRegister(weakPassReq);
    const strongErr = validateRegister(strongPassReq);

    assert(weakErr !== null, 'Weak password triggers validation error');
    assert(strongErr === null, 'NIST-compliant password passes validation');
    console.log('');

    console.log('----------------------------------------------------');
    console.log(`📊 SECURITY TEST SUITE SUMMARY: ${passed} Passed | ${failed} Failed`);
    console.log('----------------------------------------------------');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Security test suite crashed:', err);
    process.exit(1);
  }
}

runSecurityTestSuite();
