export function generateSalt() {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    return Array.from(salt)
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateUserId(masterPassword) {
    const enc = new TextEncoder();
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", enc.encode(masterPassword));
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function deriveKey(masterPassword, saltHex) {
    if (!saltHex || typeof saltHex !== 'string' || !/^[0-9a-fA-F]+$/.test(saltHex)) {
        throw new Error('Key derivation failed: saltHex is missing or contains invalid characters.');
    }
    if (saltHex.length % 2 !== 0) {
        throw new Error(`Key derivation failed: saltHex has odd length (${saltHex.length}), expected even-length hex.`);
    }

    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(masterPassword),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    return window.crypto.subtle.deriveKey(
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
}