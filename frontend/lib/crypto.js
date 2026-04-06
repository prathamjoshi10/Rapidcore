export async function generateSalt() {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
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
    throw new Error('Key derivation failed: saltHex has odd length.');
  }

  const enc = new TextEncoder();
  const saltBuffer = new Uint8Array(saltHex.match(/.{1,2}/g).map(h => parseInt(h, 16)));

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
  if (!cipherHex || typeof cipherHex !== 'string' || !/^[0-9a-fA-F]+$/.test(cipherHex)) {
    throw new Error('Decryption failed: invalid cipherHex.');
  }
  if (!ivHex || typeof ivHex !== 'string' || !/^[0-9a-fA-F]+$/.test(ivHex)) {
    throw new Error('Decryption failed: invalid ivHex.');
  }

  try {
    const cipherBuffer = new Uint8Array(cipherHex.match(/.{1,2}/g).map(h => parseInt(h, 16)));
    const ivBuffer = new Uint8Array(ivHex.match(/.{1,2}/g).map(h => parseInt(h, 16)));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      cryptoKey,
      cipherBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.error('Decryption failed: Incorrect master password or corrupted data.');
    return null;
  }
}
