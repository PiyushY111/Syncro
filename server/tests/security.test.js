import { 
  encryptField, 
  decryptField, 
  timingSafeCompare, 
  hashVerificationCode,
  generateOAuthState,
  verifyOAuthState,
  generatePasswordResetToken,
  hashToken,
  generateApiKey,
  hashApiKey
} from '../src/utils/crypto.js';
import { sanitizeString } from '../src/middlewares/sanitize.js';
import { validateRegister, validateForgotPassword, validateResetPassword, validateVerifyLogin, validateResendCode } from '../src/validators/authValidators.js';
import { verifyCsrfToken, CSRF_COOKIE_NAME } from '../src/middlewares/csrf.js';
import { isOriginAllowed } from '../src/config/corsPolicy.js';

async function runSecurityTestSuite() {
  console.log('Starting Enterprise Security & Cryptographic Verification Test Suite...\n');
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

    // Test 6: OAuth 2.0 State HMAC-SHA256 Generation & Anti-CSRF Verification
    console.log('Test 6: OAuth 2.0 HMAC-SHA256 State Anti-CSRF Protection');
    const mockUserId = 'usr-sec-101';
    const oauthState = generateOAuthState(mockUserId);
    assert(oauthState.includes('.'), 'OAuth state combines base64url payload with HMAC-SHA256 signature separated by dot');

    const verifiedResult = verifyOAuthState(oauthState);
    assert(verifiedResult.valid === true && verifiedResult.payload.userId === mockUserId, 'verifyOAuthState successfully validates signature and extracts userId');

    const tamperedState = oauthState.slice(0, -4) + 'abcd';
    const tamperedResult = verifyOAuthState(tamperedState);
    assert(tamperedResult.valid === false, 'Tampered OAuth state signature is rejected (valid: false)');

    const expiredState = generateOAuthState(mockUserId);
    // Verify with maxAgeMs = -1 to simulate immediate expiry
    const expiredResult = verifyOAuthState(expiredState, -1);
    assert(expiredResult.valid === false && expiredResult.error.includes('expired'), 'Expired OAuth state exceeds TTL and is rejected');
    console.log('');

    // Test 7: Cryptographic Password Reset Token Lifecycle & Validation
    console.log('Test 7: Password Reset Cryptographic Token & DTO Validation');
    const resetTokens = generatePasswordResetToken();
    assert(resetTokens.token.length === 64, 'Password reset raw token is 32 random bytes (64 hex characters)');
    assert(resetTokens.tokenHash.length === 64, 'SHA-256 hashed token is 64 hex characters');
    assert(hashToken(resetTokens.token) === resetTokens.tokenHash, 'hashToken deterministic SHA-256 match');

    const validForgotReq = { body: { email: 'user@syncro.dev' } };
    const invalidForgotReq = { body: { email: 'not-an-email' } };
    assert(validateForgotPassword(validForgotReq) === null, 'Valid email passes forgotPassword validation');
    assert(validateForgotPassword(invalidForgotReq) !== null, 'Invalid email fails forgotPassword validation');

    const validResetReq = { body: { token: resetTokens.token, newPassword: 'SecureResetPass123!' } };
    const weakResetReq = { body: { token: resetTokens.token, newPassword: 'short' } };
    assert(validateResetPassword(validResetReq) === null, 'Valid token and complex password pass resetPassword validation');
    assert(validateResetPassword(weakResetReq) !== null, 'Weak new password fails resetPassword validation');
    console.log('');

    // Test 8: Enterprise API Key Generation & Cryptographic Hashing
    console.log('Test 8: API Key Cryptographic Entropy & Hashing');
    const apiKeyData = generateApiKey();
    assert(apiKeyData.apiKey.startsWith('syncro_'), 'Generated API key has syncro_ prefix');
    assert(apiKeyData.keyHash.length === 64, 'Hashed API key is standard SHA-256 digest');
    assert(hashApiKey(apiKeyData.apiKey) === apiKeyData.keyHash, 'hashApiKey accurately derives identical hash from raw key');
    console.log('');

    // Test 9: CSRF Double-Submit Cookie Protection
    console.log('Test 9: CSRF Double-Submit Cookie Protection');
    const runCsrfMiddleware = (req) => {
      let called = false;
      let error = null;
      const next = (err) => { called = true; error = err || null; };
      verifyCsrfToken(req, {}, next);
      return { called, error };
    };

    const noTokenResult = runCsrfMiddleware({ method: 'POST', headers: {}, cookies: {} });
    assert(noTokenResult.called && noTokenResult.error, 'POST with no CSRF cookie or header is rejected');

    const mismatchResult = runCsrfMiddleware({
      method: 'DELETE',
      headers: { 'x-csrf-token': 'attacker-guessed-value' },
      cookies: { [CSRF_COOKIE_NAME]: 'real-session-token' },
    });
    assert(mismatchResult.called && mismatchResult.error, 'Mismatched CSRF cookie/header pair is rejected');

    const matchResult = runCsrfMiddleware({
      method: 'PUT',
      headers: { 'x-csrf-token': 'matching-token-value' },
      cookies: { [CSRF_COOKIE_NAME]: 'matching-token-value' },
    });
    assert(matchResult.called && !matchResult.error, 'Matching CSRF cookie/header pair passes');

    const getBypassResult = runCsrfMiddleware({ method: 'GET', headers: {}, cookies: {} });
    assert(getBypassResult.called && !getBypassResult.error, 'GET requests bypass CSRF check even with no token (safe/idempotent method)');

    const bearerBypassResult = runCsrfMiddleware({
      method: 'POST',
      headers: { authorization: 'Bearer some.jwt.token' },
      cookies: {},
    });
    assert(bearerBypassResult.called && !bearerBypassResult.error, 'Bearer-token requests bypass CSRF check (not driven by a browser session cookie)');
    console.log('');

    // Test 10: CORS Origin Allowlist Policy
    console.log('Test 10: CORS Origin Allowlist Policy');
    assert(isOriginAllowed('http://localhost:5173') === true, 'Known dev origin is allowed');
    assert(isOriginAllowed('https://evil-phishing-site.com') === false, 'Unrelated arbitrary origin is rejected');
    assert(isOriginAllowed('https://app.piyushydv.com') === true, 'Subdomain matching the configured suffix is allowed');
    assert(isOriginAllowed(undefined) === true, 'Same-origin/server-to-server requests (no Origin header) are allowed');
    console.log('');

    // Test 11: Auth DTO Validation Coverage (verify-login / resend-code)
    console.log('Test 11: Verification-Code Auth Route DTO Validation');
    assert(validateVerifyLogin({ body: { email: 'user@syncro.dev', code: '123456' } }) === null, 'Valid 6-digit code passes verify-login validation');
    assert(validateVerifyLogin({ body: { email: 'user@syncro.dev', code: 'abcdef' } }) !== null, 'Non-numeric code fails verify-login validation');
    assert(validateVerifyLogin({ body: { email: 'not-an-email', code: '123456' } }) !== null, 'Invalid email fails verify-login validation');
    assert(validateResendCode({ body: { email: 'user@syncro.dev' } }) === null, 'Valid email passes resend-code validation');
    assert(validateResendCode({ body: {} }) !== null, 'Missing email fails resend-code validation');
    console.log('');

    console.log('----------------------------------------------------');
    console.log(`SECURITY TEST SUITE SUMMARY: ${passed} Passed | ${failed} Failed`);
    console.log('----------------------------------------------------');

    if (failed > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Security test suite error:', err);
    process.exit(1);
  }
}

runSecurityTestSuite();
