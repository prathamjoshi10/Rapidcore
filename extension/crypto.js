/**
 * SecureVault — Extension Crypto Module
 * ======================================
 * Self-contained encryption/decryption for the Chrome extension.
 * Mirrors the logic in /encryption/ but without ES module syntax
 * (Chrome extension popups don't support ES module imports).
 *
 * Algorithm: AES-256-GCM with PBKDF2 key derivation
 * - 100,000 iterations, SHA-256
 * - 12-byte IV for GCM
 * - 16-byte random salt
 */

const SecureVaultCrypto = {

    // ─── Generate a 16-byte random salt (hex string) ───────────────
    generateSalt() {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        return Array.from(salt)
            .map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // ─── Generate userId from master password (SHA-256 hash) ───────
    async generateUserId(masterPassword) {
        const enc = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(masterPassword));
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // ─── Derive AES-GCM-256 key from master password + salt ───────
    async deriveKey(masterPassword, saltHex) {
        if (!saltHex || typeof saltHex !== 'string' || !/^[0-9a-fA-F]+$/.test(saltHex)) {
            throw new Error('Key derivation failed: saltHex is missing or invalid.');
        }
        if (saltHex.length % 2 !== 0) {
            throw new Error('Key derivation failed: saltHex has odd length.');
        }

        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            enc.encode(masterPassword),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    },

    // ─── Encrypt plaintext → { cipherHex, ivHex } ─────────────────
    async encryptData(plainText, cryptoKey) {
        const enc = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const cipherBuffer = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            cryptoKey,
            enc.encode(plainText)
        );

        const cipherHex = Array.from(new Uint8Array(cipherBuffer))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        const ivHex = Array.from(iv)
            .map(b => b.toString(16).padStart(2, '0')).join('');

        return { cipherHex, ivHex };
    },

    // ─── Decrypt cipherHex → plaintext string ─────────────────────
    async decryptData(cipherHex, ivHex, cryptoKey) {
        if (!cipherHex || !ivHex) {
            throw new Error('Decryption failed: missing cipherHex or ivHex.');
        }

        const cipherBytes = new Uint8Array(cipherHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const ivBytes = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

        try {
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: ivBytes },
                cryptoKey,
                cipherBytes
            );
            return new TextDecoder().decode(decryptedBuffer);
        } catch (err) {
            throw new Error('Decryption failed: Incorrect master password or corrupted data.');
        }
    }
};
