export { deriveKey, generateSalt, generateUserId } from './keyDerivation.js';
export { encryptData } from './encrypt.js';
export { decryptData } from './decrypt.js';

export async function encryptCredential(credential, cryptoKey) {
    const { encryptData } = await import('./encrypt.js');

    const { cipherHex: encryptedPassword, ivHex: passwordIv } =
        await encryptData(credential.password, cryptoKey);

    const { cipherHex: encryptedUsername, ivHex: usernameIv } =
        await encryptData(credential.username, cryptoKey);

    return {
        platform: credential.platform,
        url: credential.url || '',
        encryptedUsername,
        usernameIv,
        encryptedPassword,
        passwordIv
    };
}

export async function decryptCredential(encrypted, cryptoKey) {
    const { decryptData } = await import('./decrypt.js');

    const username = await decryptData(encrypted.encryptedUsername, encrypted.usernameIv, cryptoKey);
    const password = await decryptData(encrypted.encryptedPassword, encrypted.passwordIv, cryptoKey);

    return {
        platform: encrypted.platform,
        url: encrypted.url || '',
        username,
        password
    };
}
