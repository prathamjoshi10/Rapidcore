// Generate a random 16-byte salt (hex-encoded) for each credential
export function generateSalt() {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    return Array.from(salt)
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

// Derive a deterministic userId from the master password (SHA-256 hash)
// This eliminates the need for a separate signup/login flow
export async function generateUserId(masterPassword) {
    const enc = new TextEncoder();
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", enc.encode(masterPassword));
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

// Derive an AES-256-CBC key from master password + salt using PBKDF2
export async function deriveKey(masterPassword, saltHex) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(masterPassword),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    // Convert hex salt to Uint8Array
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000, 
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-CBC", length: 256 }, 
        false,
        ["encrypt", "decrypt"]
    );
}