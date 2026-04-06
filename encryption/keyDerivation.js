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