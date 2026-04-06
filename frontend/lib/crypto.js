// lib/crypto.js
// Browser-compatible encryption wrappers using Web Crypto API

export async function generateSalt() {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateUserId(masterPassword) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Deterministic salt for userId derivation
  const salt = enc.encode("securevault-userid-salt");
  
  const hashBuffer = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function deriveKey(masterPassword, saltHex) {
  const enc = new TextEncoder();
  const saltBuffer = new Uint8Array(saltHex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));
  
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-CBC', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(plaintext, cryptoKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: iv },
    cryptoKey,
    enc.encode(plaintext)
  );

  const cipherHex = Array.from(new Uint8Array(ciphertextBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  const ivHex = Array.from(iv)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return { cipherHex, ivHex };
}

export async function decryptData(cipherHex, ivHex, cryptoKey) {
  try {
    const cipherBuffer = new Uint8Array(cipherHex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));
    const ivBuffer = new Uint8Array(ivHex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: ivBuffer },
      cryptoKey,
      cipherBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed. Wrong password?");
    return null;
  }
}
