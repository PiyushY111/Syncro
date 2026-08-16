import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_STRING = process.env.FIELD_ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-secret-32-character-key-for-dev';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(KEY_STRING).digest();

/**
 * Encrypts sensitive text using AES-256-GCM with randomized IV.
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
    console.error('[ENCRYPTION ERROR]', err.message);
    return text;
  }
};

/**
 * Decrypts AES-256-GCM encrypted text.
 *
 * @param {string} encryptedText
 * @returns {string|null} Original decrypted text
 */
export const decryptField = (encryptedText) => {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
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
    console.error('[DECRYPTION ERROR]', err.message);
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

export default {
  encryptField,
  decryptField,
  timingSafeCompare,
  hashVerificationCode,
};
