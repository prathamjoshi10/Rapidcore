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
        console.error('Decryption failed: Incorrect master password or corrupted/tampered data.');
        throw new Error('Decryption failed: Incorrect master password or corrupted/tampered data.');
    }
}