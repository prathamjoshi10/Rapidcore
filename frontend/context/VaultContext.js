'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateUserId } from '../lib/crypto';

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
