/**
 * Validate a hex string: must be non-empty, even-length, and hex-only.
 * @param {*} hex - Value to validate
 * @param {string} label - Name for error messages (e.g. 'cipherHex')
 * @throws {Error} If validation fails
 */
function validateHex(hex, label) {
    if (!hex || typeof hex !== 'string') {
        throw new Error(`Decryption failed: ${label} is missing or not a string.`);
    }
    if (!/^[0-9a-fA-F]+$/.test(hex)) {
        throw new Error(`Decryption failed: ${label} contains invalid characters.`);
    }
    if (hex.length % 2 !== 0) {
        throw new Error(`Decryption failed: ${label} has odd length (${hex.length}), expected even-length hex.`);
    }
}

/**
 * Decrypt AES-256-GCM encrypted data back to plaintext.
 * GCM mode provides authenticated decryption - tampered ciphertext will
 * fail with a clear error rather than silently producing garbage.
 *
 * @param {string} cipherHex - Hex-encoded ciphertext (includes GCM auth tag)
 * @param {string} ivHex     - Hex-encoded initialization vector (24 hex chars = 12 bytes)
 * @param {CryptoKey} cryptoKey - Derived AES key
 * @returns {string} Decrypted plaintext
 * @throws {Error} With descriptive message on any failure
 */
export async function decryptData(cipherHex, ivHex, cryptoKey) {
    validateHex(cipherHex, 'cipherHex');
    validateHex(ivHex, 'ivHex');

    const dec = new TextDecoder();
    const cipherBytes = new Uint8Array(cipherHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const ivBytes = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    try {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: ivBytes
            },
            cryptoKey,
            cipherBytes
        );

        return dec.decode(decryptedBuffer);
    } catch (err) {
        // Log generic message only; avoid exposing crypto internals in console
        console.error('Decryption failed: Incorrect master password or corrupted/tampered data.');
        throw new Error('Decryption failed: Incorrect master password or corrupted/tampered data.');
    }
}