function hexToBytes(hex, label, expectedByteLength) {
  if (!hex || typeof hex !== 'string' || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error(`${label} is missing or contains invalid characters.`);
  }
  if (hex.length % 2 !== 0) {
    throw new Error(`${label} has odd length.`);
  }

  const bytes = new Uint8Array(hex.match(/.{1,2}/g).map((h) => parseInt(h, 16)));

  if (expectedByteLength && bytes.length !== expectedByteLength) {
    throw new Error(`${label} must be ${expectedByteLength} bytes.`);
  }

  return bytes;
}

export async function generateSalt() {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateUserId(masterPassword) {
  if (!masterPassword || typeof masterPassword !== 'string') {
    throw new Error('Master password is required.');
  }

  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", enc.encode(masterPassword));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function deriveKey(masterPassword, saltHex) {
  if (!masterPassword || typeof masterPassword !== 'string') {
    throw new Error('Key derivation failed: master password is required.');
  }

  const enc = new TextEncoder();
  const saltBuffer = hexToBytes(saltHex, 'saltHex', 16);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(plaintext, cryptoKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    cryptoKey,
    enc.encode(plaintext)
  );

  const cipherHex = Array.from(new Uint8Array(ciphertextBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  const ivHex = Array.from(iv)
    .map(b => b.toString(16).padStart(2, '0')).join('');

  return { cipherHex, ivHex };
}

export async function decryptData(cipherHex, ivHex, cryptoKey) {
  const cipherBuffer = hexToBytes(cipherHex, 'cipherHex');
  const ivBuffer = hexToBytes(ivHex, 'ivHex', 12);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      cryptoKey,
      cipherBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    console.error('Decryption failed: Incorrect master password or corrupted data.');
    throw new Error('Decryption failed: Incorrect master password or corrupted data.');
  }
}
