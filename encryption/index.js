/**
 * SecureVault - Encryption Module
 * ===============================
 * Zero-knowledge encryption using Web Crypto API
 * - AES-256-GCM for authenticated encryption/decryption
 * - PBKDF2 (100k iterations, SHA-256) for key derivation
 * - All crypto runs client-side; server never sees plaintext
 *
 * Exports:
 *   generateSalt()       - 16-byte random salt (hex) from keyDerivation.js
 *   generateUserId()     - SHA-256 hash of master password from keyDerivation.js
 *   deriveKey()          - PBKDF2 key derivation from keyDerivation.js
 *   encryptData()        - AES-GCM encrypt from encrypt.js
 *   decryptData()        - AES-GCM decrypt from decrypt.js
 *   encryptCredential()  - Encrypt full credential object (below)
 *   decryptCredential()  - Decrypt full credential object (below)
 */

export { deriveKey, generateSalt, generateUserId } from './keyDerivation.js';
export { encryptData } from './encrypt.js';
export { decryptData } from './decrypt.js';

/**
 * Encrypt a full credential object (platform, username, password, url).
 * Only username and password are encrypted - platform & url stay plaintext
 * for search/display purposes.
 *
 * @param {Object} credential - { platform, url, username, password }
 * @param {CryptoKey} cryptoKey - Derived AES-GCM key from master password
 * @returns {Object} - { platform, url, encryptedUsername, usernameIv, encryptedPassword, passwordIv }
 */
export async function encryptCredential(credential, cryptoKey) {
    // Use static imports instead of dynamic import() to avoid unnecessary indirection
    const { encryptData } = await import('./encrypt.js');

    const { cipherHex: encryptedPassword, ivHex: passwordIv } =
        await encryptData(credential.password, cryptoKey);

    const { cipherHex: encryptedUsername, ivHex: usernameIv } =
        await encryptData(credential.username, cryptoKey);

    return {
        platform: credential.platform,
        url: credential.url || '',
        encryptedUsername,
        usernameIv,
        encryptedPassword,
        passwordIv
    };
}

/**
 * Decrypt a full credential object back to plaintext.
 *
 * @param {Object} encrypted - The encrypted credential from the backend
 * @param {CryptoKey} cryptoKey - Derived AES-GCM key from master password
 * @returns {Object} - { platform, url, username, password }
 */
export async function decryptCredential(encrypted, cryptoKey) {
    const { decryptData } = await import('./decrypt.js');

    const username = await decryptData(encrypted.encryptedUsername, encrypted.usernameIv, cryptoKey);
    const password = await decryptData(encrypted.encryptedPassword, encrypted.passwordIv, cryptoKey);

    return {
        platform: encrypted.platform,
        url: encrypted.url || '',
        username,
        password
    };
}
