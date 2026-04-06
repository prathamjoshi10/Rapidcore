// Encrypts plaintext using AES-256-GCM with a unique IV per operation.
// GCM provides both encryption and authentication (integrity protection).
export async function encryptData(plainTextPassword, cryptoKey) {
    const enc = new TextEncoder();
    // AES-GCM uses a 12-byte IV (recommended by NIST)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const cipherBuffer = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        cryptoKey,
        enc.encode(plainTextPassword)
    );

    // Convert to hex for database storage
    const cipherHex = Array.from(new Uint8Array(cipherBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
    const ivHex = Array.from(iv)
        .map(b => b.toString(16).padStart(2, '0')).join('');

    return { cipherHex, ivHex };
}