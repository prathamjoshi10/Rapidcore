export async function encryptData(plainTextPassword, cryptoKey) {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const cipherBuffer = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        cryptoKey,
        enc.encode(plainTextPassword)
    );

    const cipherHex = Array.from(new Uint8Array(cipherBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
    const ivHex = Array.from(iv)
        .map(b => b.toString(16).padStart(2, '0')).join('');

    return { cipherHex, ivHex };
}