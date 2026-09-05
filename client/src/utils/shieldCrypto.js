/**
 * Syncro Shield Cryptographic Engine (Client WebCrypto)
 * Hardware-accelerated NIST P-256 ECDH, HKDF-SHA256, AES-256-GCM & HMAC-SHA256.
 */

const subtle = window.crypto?.subtle;

// Helper: Convert ArrayBuffer to Hex string
export const bufferToHex = (buffer) => {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
};

// Helper: Convert Hex string to Uint8Array
export const hexToUint8Array = (hexString) => {
    const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
    const match = cleanHex.match(/.{1,2}/g);
    if (!match) return new Uint8Array(0);
    return new Uint8Array(match.map((byte) => parseInt(byte, 16)));
};

// Helper: Generate cryptographically random hex string
export const generateRandomHex = (lengthBytes = 16) => {
    const bytes = new Uint8Array(lengthBytes);
    window.crypto.getRandomValues(bytes);
    return bufferToHex(bytes);
};

/**
 * Generates an ephemeral ECDH P-256 key pair in browser memory.
 * Keys never leave volatile memory.
 */
export const generateECDHKeyPair = async () => {
    return await subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        false, // Private key is non-extractable from browser memory for maximum security
        ['deriveKey', 'deriveBits']
    );
};

/**
 * Exports client ECDH public key as raw uncompressed hex.
 */
export const exportPublicKeyHex = async (publicKey) => {
    const raw = await subtle.exportKey('raw', publicKey);
    return bufferToHex(raw);
};

/**
 * Derives symmetric session encryption key (AES-256-GCM) and authentication key (HMAC-SHA256)
 * from client private key and server public key hex via HKDF-SHA256.
 */
export const deriveSessionKeys = async (clientPrivateKey, serverPublicKeyHex) => {
    const serverPubBytes = hexToUint8Array(serverPublicKeyHex);
    const importedServerPub = await subtle.importKey(
        'raw',
        serverPubBytes,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
    );

    // Compute 256-bit Diffie-Hellman shared secret
    const sharedBits = await subtle.deriveBits(
        { name: 'ECDH', public: importedServerPub },
        clientPrivateKey,
        256
    );

    // Import shared bits for HKDF expansion
    const hkdfBaseKey = await subtle.importKey(
        'raw',
        sharedBits,
        { name: 'HKDF' },
        false,
        ['deriveKey']
    );

    // Derive K_enc (AES-256-GCM)
    const encKey = await subtle.deriveKey(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: new Uint8Array(),
            info: new TextEncoder().encode('syncro-shield-encryption')
        },
        hkdfBaseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );

    // Derive K_auth (HMAC-SHA256)
    const authKey = await subtle.deriveKey(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: new Uint8Array(),
            info: new TextEncoder().encode('syncro-shield-auth')
        },
        hkdfBaseKey,
        { name: 'HMAC', hash: 'SHA-256', length: 256 },
        false,
        ['sign', 'verify']
    );

    return { encKey, authKey };
};

/**
 * Encrypts a JavaScript object using AES-256-GCM with a randomized 12-byte IV
 * and variable jitter noise padding (to neutralize packet-length side-channel attacks).
 * Returns serialized envelope "ivHex:tagHex:ciphertextHex".
 */
export const encryptShieldPayload = async (data, encKey) => {
    const iv = new Uint8Array(12);
    window.crypto.getRandomValues(iv);

    // Add 32 to 96 bytes of random cryptographic noise padding
    const paddingLength = Math.floor(Math.random() * 64) + 32;
    const noise = generateRandomHex(paddingLength);

    const envelopeObj = {
        d: data,
        _n: noise
    };

    const encoded = new TextEncoder().encode(JSON.stringify(envelopeObj));

    // WebCrypto AES-GCM appends the 16-byte auth tag at the end of the ciphertext
    const encryptedBuf = await subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        encKey,
        encoded
    );

    const encryptedBytes = new Uint8Array(encryptedBuf);
    const tagBytes = encryptedBytes.slice(encryptedBytes.length - 16);
    const cipherBytes = encryptedBytes.slice(0, encryptedBytes.length - 16);

    const ivHex = bufferToHex(iv);
    const tagHex = bufferToHex(tagBytes);
    const cipherHex = bufferToHex(cipherBytes);

    return `${ivHex}:${tagHex}:${cipherHex}`;
};

/**
 * Decrypts an encrypted envelope "ivHex:tagHex:ciphertextHex" using AES-256-GCM.
 * Validates authentication tag and strips jitter noise.
 */
export const decryptShieldPayload = async (envelopeStr, encKey) => {
    if (!envelopeStr || typeof envelopeStr !== 'string') {
        throw new Error('Invalid shield envelope');
    }

    const parts = envelopeStr.split(':');
    if (parts.length !== 3) {
        throw new Error('Malformed shield envelope structure');
    }

    const [ivHex, tagHex, cipherHex] = parts;
    const iv = hexToUint8Array(ivHex);
    const tagBytes = hexToUint8Array(tagHex);
    const cipherBytes = hexToUint8Array(cipherHex);

    // Recombine ciphertext + tag for WebCrypto
    const combined = new Uint8Array(cipherBytes.length + tagBytes.length);
    combined.set(cipherBytes, 0);
    combined.set(tagBytes, cipherBytes.length);

    const decryptedBuf = await subtle.decrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        encKey,
        combined
    );

    const decryptedStr = new TextDecoder().decode(decryptedBuf);
    const parsed = JSON.parse(decryptedStr);
    return parsed.d !== undefined ? parsed.d : parsed;
};

/**
 * Generates an HMAC-SHA256 signature string for request authentication and anti-tampering.
 */
export const generateHmacSignature = async (messageString, authKey) => {
    const encoded = new TextEncoder().encode(messageString);
    const sigBuf = await subtle.sign('HMAC', authKey, encoded);
    return bufferToHex(sigBuf);
};
