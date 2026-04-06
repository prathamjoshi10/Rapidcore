// Encrypts plaintext using AES-256-CBC and generates a unique IV
export async function encryptData(plainTextPassword, cryptoKey) {
    const enc = new TextEncoder();
    // AES-CBC requires a 16-byte Initialization Vector
    const iv = window.crypto.getRandomValues(new Uint8Array(16));

    const cipherBuffer = await window.crypto.subtle.encrypt(
        {
            name: "AES-CBC",
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