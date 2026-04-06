export async function decryptData(cipherHex, ivHex, cryptoKey) {
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
    } catch (error) {
        console.error("Decryption failed. Incorrect Master Password or corrupted data.");
        throw new Error("Decryption failed");
    }
}