'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { generateUserId, packVault, unpackVault } from '../lib/crypto';
import api from '../lib/api';

const VaultContext = createContext();

export function VaultProvider({ children }) {
  const [masterPassword, setMasterPassword] = useState(null);
  const [userId, setUserId] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  useEffect(() => {
    let timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      if (isUnlocked) {
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
  const saveVault = useCallback(async (pwd, uid, creds) => {
    setIsSaving(true);
    try {
      const blob = creds.length > 0 ? await packVault(pwd, creds) : "";
      await api.post('/store', { userId: uid, vault: blob });
    } finally {
      setIsSaving(false);
    }
  }, []);
  const unlockVault = async (password) => {
    const uid = await generateUserId(password);

    const res = await api.get('/api/vault', { params: { userId: uid } });
    if (!res.data?.exists) {
      throw new Error('Vault account not found');
    }
    let creds = [];
    try {
      const dataRes = await api.get('/retrieve', { params: { userId: uid } });
      const blob = dataRes.data?.vault || "";
      if (blob) {
        creds = await unpackVault(password, blob);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        throw err;
      }
    }

    setMasterPassword(password);
    setUserId(uid);
    setCredentials(creds);
    setIsUnlocked(true);
  };
  const createVaultAccount = async (password) => {
    const uid = await generateUserId(password);
    const res = await api.post('/api/vault', { userId: uid });

    setMasterPassword(password);
    setUserId(uid);
    setCredentials([]);
    setIsUnlocked(true);

    return res.data?.recoveryKey || '';
  };
  const resetVaultAccount = async (recoveryKey, newPassword) => {
    const uid = await generateUserId(newPassword);
    const res = await api.post('/api/vault/reset', {
      recoveryKey,
      newUserId: uid,
    });

    setMasterPassword(newPassword);
    setUserId(uid);
    setCredentials([]);
    setIsUnlocked(true);

    return res.data?.recoveryKey || '';
  };
  const lockVault = () => {
    setMasterPassword(null);
    setUserId(null);
    setCredentials([]);
    setIsUnlocked(false);
    router.push('/');
  };

  const addCredential = async (cred) => {
    const newCred = {
      ...cred,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUsed: null,
      usageCount: 0,
    };
    const updated = [...credentials, newCred];
    setCredentials(updated);
    await saveVault(masterPassword, userId, updated);
    return newCred;
  };

  const updateCredential = async (id, changes) => {
    const updated = credentials.map(c =>
      c.id === id ? { ...c, ...changes, updatedAt: new Date().toISOString() } : c
    );
    setCredentials(updated);
    await saveVault(masterPassword, userId, updated);
  };

  const deleteCredential = async (id) => {
    const updated = credentials.filter(c => c.id !== id);
    setCredentials(updated);
    await saveVault(masterPassword, userId, updated);
  };

  const trackUsage = (id) => {
    const updated = credentials.map(c =>
      c.id === id
        ? { ...c, usageCount: (c.usageCount || 0) + 1, lastUsed: new Date().toISOString() }
        : c
    );
    setCredentials(updated);
    saveVault(masterPassword, userId, updated).catch(() => {});
  };

  return (
    <VaultContext.Provider
      value={{
        masterPassword,
        userId,
        credentials,
        isUnlocked,
        isSaving,
        unlockVault,
        createVaultAccount,
        resetVaultAccount,
        lockVault,
        addCredential,
        updateCredential,
        deleteCredential,
        trackUsage,
      }}
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
