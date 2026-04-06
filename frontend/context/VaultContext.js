'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateUserId, deriveKey } from '../lib/crypto';

const VaultContext = createContext();

export function VaultProvider({ children }) {
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const router = useRouter();

  // Auto-lock timer logic
  useEffect(() => {
    let timeout;
    
    const resetTimer = () => {
      clearTimeout(timeout);
      if (isUnlocked) {
        // 5 minutes auto-lock
        timeout = setTimeout(() => {
          lockVault();
        }, 5 * 60 * 1000);
      }
    };

    if (isUnlocked) {
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keypress', resetTimer);
      resetTimer();
    }

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
    };
  }, [isUnlocked]);

  const unlockVault = async (masterPassword) => {
    // Determine userId hash and master key based on masterPassword
    // Wait, to derive the encryption key, we need a salt per credential.
    // The context will store the master password temporarily? 
    // No, if we only store the CryptoKey, it's tied to a single salt.
    // But since each credential has its own salt, we CANNOT store the single encryption key.
    // We must store the master password in memory to derive keys for each credential.
    
    // So the context should hold the masterPassword (in memory only).
    // Let's store a generic key material or just the password string in state.
    // Storing string in React state is memory-only.
    
    const currentUserId = await generateUserId(masterPassword);
    
    setEncryptionKey(masterPassword); // Storing the password in memory to derive per-credential keys
    setUserId(currentUserId);
    setIsUnlocked(true);
  };

  const lockVault = () => {
    setEncryptionKey(null);
    setUserId(null);
    setIsUnlocked(false);
    router.push('/');
  };

  return (
    <VaultContext.Provider value={{ encryptionKey, userId, isUnlocked, unlockVault, lockVault }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
