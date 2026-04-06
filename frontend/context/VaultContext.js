'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateUserId } from '../lib/crypto';
import api from '../lib/api';

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

    const res = await api.get('/api/vault', { params: { userId: currentUserId } });
    if (!res.data?.exists) {
      throw new Error('Vault account not found');
    }

    setEncryptionKey(masterPassword); // Storing the password in memory to derive per-credential keys
    setUserId(currentUserId);
    setIsUnlocked(true);
  };

  const createVaultAccount = async (masterPassword) => {
    const currentUserId = await generateUserId(masterPassword);
    const res = await api.post('/api/vault', { userId: currentUserId });

    setEncryptionKey(masterPassword);
    setUserId(currentUserId);
    setIsUnlocked(true);

    return res.data?.recoveryKey || '';
  };

  const resetVaultAccount = async (recoveryKey, newMasterPassword) => {
    const currentUserId = await generateUserId(newMasterPassword);
    const res = await api.post('/api/vault/reset', {
      recoveryKey,
      newUserId: currentUserId,
    });

    setEncryptionKey(newMasterPassword);
    setUserId(currentUserId);
    setIsUnlocked(true);

    return res.data?.recoveryKey || '';
  };

  const lockVault = () => {
    setEncryptionKey(null);
    setUserId(null);
    setIsUnlocked(false);
    router.push('/');
  };

  return (
    <VaultContext.Provider
      value={{ encryptionKey, userId, isUnlocked, unlockVault, createVaultAccount, resetVaultAccount, lockVault }}
    >
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
