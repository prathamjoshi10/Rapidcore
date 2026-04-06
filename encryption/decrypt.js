/**
 * Decrypt AES-256-CBC encrypted data back to plaintext.
 *
 * @param {string} cipherHex - Hex-encoded ciphertext
 * @param {string} ivHex     - Hex-encoded initialization vector
 * @param {CryptoKey} cryptoKey - Derived AES key
 * @returns {string} Decrypted plaintext
 * @throws {Error} With descriptive message on any failure
 */
export async function decryptData(cipherHex, ivHex, cryptoKey) {
    // Input validation - prevents null .map() crash from .match()
    if (!cipherHex || typeof cipherHex !== 'string' || !/^[0-9a-fA-F]+$/.test(cipherHex)) {
        throw new Error('Decryption failed: cipherHex is missing or contains invalid characters.');
    }
    if (!ivHex || typeof ivHex !== 'string' || !/^[0-9a-fA-F]+$/.test(ivHex)) {
        throw new Error('Decryption failed: ivHex is missing or contains invalid characters.');
    }

    const dec = new TextDecoder();
    const cipherBytes = new Uint8Array(cipherHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const ivBytes = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    try {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-CBC",
                iv: ivBytes
            },
            cryptoKey,
            cipherBytes
        );

        return dec.decode(decryptedBuffer);
    } catch (err) {
        // Preserve original error for diagnostics while keeping a consistent message
        console.error('Decryption failed: Incorrect master password or corrupted data.', err);
        throw new Error('Decryption failed: Incorrect master password or corrupted data.');
    }
}