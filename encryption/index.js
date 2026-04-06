// Barrel export — single clean import for the entire encryption module
export { generateSalt, generateUserId, deriveKey } from './keyDerivation.js';
export { encryptData } from './encrypt.js';
export { decryptData } from './decrypt.js';
