/**
 * SecureVault - Encryption Module
 * ===============================
 * Zero-knowledge encryption using Web Crypto API
 * - AES-256-CBC for encryption/decryption
 * - PBKDF2 (100k iterations, SHA-256) for key derivation
 * - All crypto runs client-side; server never sees plaintext
 */

export { deriveKey, generateSalt, generateUserId } from './keyDerivation.js';
export { encryptData } from './encrypt.js';
export { decryptData } from './decrypt.js';

// Generate a cryptographically random 16-byte salt (returned as hex).
// This salt should be stored in localStorage (or sent to backend alongside
// encrypted data) so the same key can be re-derived on future logins.

/**
 * Encrypt a full credential object (platform, username, password, url).
 * Only username and password are encrypted - platform & url stay plaintext
 * for search/display purposes.
 *
 * @param {Object} credential - { platform, url, username, password }
 * @param {CryptoKey} cryptoKey - Derived AES key from master password
 * @returns {Object} - { platform, url, encryptedUsername, usernameIv, encryptedPassword, passwordIv }
 */
export async function encryptCredential(credential, cryptoKey) {
    const { encryptData: encrypt } = await import('./encrypt.js');

    const { cipherHex: encryptedPassword, ivHex: passwordIv } =
        await encrypt(credential.password, cryptoKey);

    const { cipherHex: encryptedUsername, ivHex: usernameIv } =
        await encrypt(credential.username, cryptoKey);

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
 * @param {CryptoKey} cryptoKey - Derived AES key from master password
 * @returns {Object} - { platform, url, username, password }
 */
export async function decryptCredential(encrypted, cryptoKey) {
    const { decryptData: decrypt } = await import('./decrypt.js');

    const username = await decrypt(encrypted.encryptedUsername, encrypted.usernameIv, cryptoKey);
    const password = await decrypt(encrypted.encryptedPassword, encrypted.passwordIv, cryptoKey);

    return {
        platform: encrypted.platform,
        url: encrypted.url || '',
        username,
        password
    };
}
