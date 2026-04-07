
const VAULT_VERSION = 1;
const SALT_BYTES   = 16;
const IV_BYTES     = 12;
const HEADER_BYTES = 1 + SALT_BYTES + IV_BYTES; // 29 bytes

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

export async function generateUserId(masterPassword) {
  if (!masterPassword || typeof masterPassword !== 'string') {
    throw new Error('Master password is required.');
  }

  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", enc.encode(masterPassword));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

async function deriveKey(masterPassword, salt) {
  const enc = new TextEncoder();

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
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function packVault(masterPassword, credentials) {
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv   = window.crypto.getRandomValues(new Uint8Array(IV_BYTES));

  const cryptoKey = await deriveKey(masterPassword, salt);

  const plaintext = JSON.stringify({ credentials });
  const enc = new TextEncoder();

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    enc.encode(plaintext)
  );

  const ciphertext = new Uint8Array(ciphertextBuffer);
  const packed = new Uint8Array(HEADER_BYTES + ciphertext.length);
  packed[0] = VAULT_VERSION;
  packed.set(salt, 1);
  packed.set(iv, 1 + SALT_BYTES);
  packed.set(ciphertext, HEADER_BYTES);
  let binary = '';
  for (let i = 0; i < packed.length; i++) {
    binary += String.fromCharCode(packed[i]);
  }
  return btoa(binary);
}

export async function unpackVault(masterPassword, base64Blob) {
  if (!base64Blob || base64Blob.length === 0) {
    return [];
  }
  const binary = atob(base64Blob);
  const packed = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    packed[i] = binary.charCodeAt(i);
  }

  if (packed.length < HEADER_BYTES + 1) {
    throw new Error('Vault data is corrupted or too short.');
  }
  const version    = packed[0];
  const salt       = packed.slice(1, 1 + SALT_BYTES);
  const iv         = packed.slice(1 + SALT_BYTES, HEADER_BYTES);
  const ciphertext = packed.slice(HEADER_BYTES);

  if (version !== VAULT_VERSION) {
    throw new Error(`Unsupported vault version: ${version}`);
  }

  const cryptoKey = await deriveKey(masterPassword, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    );

    const json = new TextDecoder().decode(decryptedBuffer);
    const data = JSON.parse(json);
    return data.credentials || [];
  } catch {
    throw new Error('Decryption failed: Incorrect master password or corrupted vault.');
  }
}
