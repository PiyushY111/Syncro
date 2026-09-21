import crypto from 'crypto';
import logger from './logger/logger.js';

const ALGORITHM = 'aes-256-gcm';
const KEY_STRING = process.env.FIELD_ENCRYPTION_KEY || process.env.JWT_SECRET;
if (!KEY_STRING) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL ERROR: FIELD_ENCRYPTION_KEY or JWT_SECRET must be configured in production!');
  }
}
const EFFECTIVE_KEY = KEY_STRING || 'default-secret-32-character-key-for-dev';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(EFFECTIVE_KEY).digest();

/**
 * Encrypts sensitive text using AES-256-GCM with randomized IV.
 * Throws on failure to prevent silent plaintext persistence.
 *
 * @param {string} text
 * @returns {string|null} Encrypted string format iv:authTag:encryptedData
 */
export const encryptField = (text) => {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    logger.error('[ENCRYPTION ERROR]', { error: err.message });
    throw new Error(`Field encryption failed: ${err.message}`);
  }
};

/**
 * Decrypts AES-256-GCM encrypted text.
 *
 * @param {string} encryptedText
 * @returns {string|null} Original decrypted text
 */
export const decryptField = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.includes(':')) return encryptedText;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText;

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedData = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    logger.error('[DECRYPTION ERROR]', { error: err.message });
    return encryptedText;
  }
};

/**
 * Performs a constant-time string comparison resistant to side-channel timing attacks.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean} True if strings match exactly
 */
export const timingSafeCompare = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    // Perform dummy comparison against itself to preserve timing characteristics
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Computes SHA-256 hash digest of a verification code or sensitive string.
 *
 * @param {string} code
 * @returns {string} SHA-256 hex string
 */
export const hashVerificationCode = (code) => {
  if (!code) return '';
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
};

/**
 * Generates cryptographic SHA-256 hash for audit log chain integrity.
 *
 * @param {Object} params
 * @returns {string} SHA-256 hex string
 */
export const generateAuditHash = ({ prevHash = 'GENESIS', workspaceId, userId, action, entityType, entityId = '', details = {} }) => {
  const payloadString = `${prevHash}:${workspaceId}:${userId}:${action}:${entityType}:${entityId || ''}:${JSON.stringify(details)}`;
  return crypto.createHash('sha256').update(payloadString).digest('hex');
};

/**
 * Generates an HMAC-SHA256 signed OAuth 2.0 state parameter to prevent CSRF and session fixation.
 *
 * @param {string} userId - User ID initiating the OAuth flow
 * @param {Object} [metadata={}] - Additional metadata to embed
 * @returns {string} base64url-encoded signed state token
 */
export const generateOAuthState = (userId, metadata = {}) => {
  const payload = {
    userId,
    nonce: crypto.randomBytes(16).toString('hex'),
    timestamp: Date.now(),
    ...metadata,
  };
  const serialized = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', ENCRYPTION_KEY).update(serialized).digest('base64url');
  return `${serialized}.${signature}`;
};

/**
 * Validates an HMAC-SHA256 signed OAuth 2.0 state parameter and verifies expiration.
 *
 * @param {string} stateString - The incoming state query parameter
 * @param {number} [maxAgeMs=600000] - Maximum state age in ms (default 10 minutes)
 * @returns {{ valid: boolean, payload?: Object, error?: string }}
 */
export const verifyOAuthState = (stateString, maxAgeMs = 600000) => {
  if (!stateString || typeof stateString !== 'string') {
    return { valid: false, error: 'State parameter missing or invalid' };
  }
  const parts = stateString.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed state parameter format' };
  }
  const [serialized, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', ENCRYPTION_KEY).update(serialized).digest('base64url');
  if (!timingSafeCompare(signature, expectedSig)) {
    return { valid: false, error: 'Invalid state signature - possible CSRF tampering' };
  }
  try {
    const payload = JSON.parse(Buffer.from(serialized, 'base64url').toString('utf8'));
    if (!payload.userId || !payload.timestamp) {
      return { valid: false, error: 'Invalid state payload structure' };
    }
    const age = Date.now() - payload.timestamp;
    if (age > maxAgeMs) {
      return { valid: false, error: 'OAuth state token has expired' };
    }
    return { valid: true, payload };
  } catch (e) {
    return { valid: false, error: 'Corrupted state payload encoding' };
  }
};

/**
 * Generates a cryptographically secure password reset token and its SHA-256 database hash.
 *
 * @param {number} [ttlMinutes=15] - Time to live in minutes
 * @returns {{ token: string, tokenHash: string, expiresAt: Date }}
 */
export const generatePasswordResetToken = (ttlMinutes = 15) => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  return { token, tokenHash, expiresAt };
};

/**
 * Computes SHA-256 digest of a raw token.
 *
 * @param {string} token
 * @returns {string}
 */
export const hashToken = (token) => {
  if (!token) return '';
  return crypto.createHash('sha256').update(String(token).trim()).digest('hex');
};

/**
 * Generates a programmatic API key with prefix and secret hash.
 *
 * @returns {{ apiKey: string, keyPrefix: string, keyHash: string }}
 */
export const generateApiKey = () => {
  const prefix = crypto.randomBytes(4).toString('hex');
  const secret = crypto.randomBytes(24).toString('hex');
  const apiKey = `syncro_${prefix}_${secret}`;
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  return { apiKey, keyPrefix: prefix, keyHash };
};

/**
 * Computes SHA-256 hash of an API key for comparison.
 *
 * @param {string} key
 * @returns {string}
 */
export const hashApiKey = (key) => {
  if (!key) return '';
  return crypto.createHash('sha256').update(String(key).trim()).digest('hex');
};

export default {
  encryptField,
  decryptField,
  timingSafeCompare,
  hashVerificationCode,
  generateAuditHash,
  generateOAuthState,
  verifyOAuthState,
  generatePasswordResetToken,
  hashToken,
  generateApiKey,
  hashApiKey,
};

