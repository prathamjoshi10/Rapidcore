const PIN_HASH_STORAGE_KEY = 'securevault.quickUnlock.pinHash';
const PIN_LOCK_STORAGE_KEY = 'securevault.quickUnlock.lockUntil';
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCK_DURATION_MS = 30 * 1000;

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function isValidPin(pin) {
  return /^\d{4,6}$/.test(pin);
}

export async function hashPin(pin) {
  const buffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

export function getStoredPinHash() {
  const storage = getStorage();
  return storage?.getItem(PIN_HASH_STORAGE_KEY) || '';
}

export function storePinHash(pinHash) {
  const storage = getStorage();
  storage?.setItem(PIN_HASH_STORAGE_KEY, pinHash);
}

export function clearStoredPin() {
  const storage = getStorage();
  storage?.removeItem(PIN_HASH_STORAGE_KEY);
  storage?.removeItem(PIN_LOCK_STORAGE_KEY);
}

export function getPinLockUntil() {
  const storage = getStorage();
  const rawValue = storage?.getItem(PIN_LOCK_STORAGE_KEY);
  const lockUntil = Number(rawValue);

  if (!lockUntil || Number.isNaN(lockUntil)) {
    return 0;
  }

  if (lockUntil <= Date.now()) {
    storage?.removeItem(PIN_LOCK_STORAGE_KEY);
    return 0;
  }

  return lockUntil;
}

export function setPinLock() {
  const storage = getStorage();
  const lockUntil = Date.now() + PIN_LOCK_DURATION_MS;
  storage?.setItem(PIN_LOCK_STORAGE_KEY, String(lockUntil));
  return lockUntil;
}

export { MAX_PIN_ATTEMPTS, PIN_LOCK_DURATION_MS };
