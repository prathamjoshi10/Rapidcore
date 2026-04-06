'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVault } from '../../context/VaultContext';
import SearchBar from '../../components/SearchBar';
import VaultList from '../../components/VaultList';
import api from '../../lib/api';
import { decryptData, deriveKey } from '../../lib/crypto';
import styles from './page.module.css';

export default function DashboardPage() {
  const [credentials, setCredentials] = useState([]);
  const [filteredCredentials, setFilteredCredentials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { isUnlocked, userId, encryptionKey } = useVault();
  const router = useRouter();

  useEffect(() => {
    if (!isUnlocked) {
      router.push('/');
      return;
    }

    if (!userId || !encryptionKey) {
      return;
    }

    fetchCredentials();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked, userId, encryptionKey]);

  const fetchCredentials = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/credentials?userId=${userId}`);
      const creds = await Promise.all(
        (res.data.credentials || []).map(async (credential) => {
          if (!credential.encryptedUsername || !credential.usernameIv) {
            return credential;
          }

          try {
            const key = await deriveKey(encryptionKey, credential.salt);
            const username = await decryptData(credential.encryptedUsername, credential.usernameIv, key);
            return { ...credential, username };
          } catch (err) {
            console.error('Failed to decrypt username:', err);
            return { ...credential, username: '' };
          }
        })
      );
      setCredentials(creds);
      setFilteredCredentials(creds);
    } catch (err) {
      console.error('Failed to fetch credentials:', err);
      setError('Failed to load credentials from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query) {
      setFilteredCredentials(credentials);
      return;
    }
    
    try {
      const lowerQ = query.toLowerCase();
      const filtered = credentials.filter(c => c.platform.toLowerCase().includes(lowerQ));
      setFilteredCredentials(filtered);
    } catch (err) {
      console.error('Search failed', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this credential?')) return;
    
    try {
      await api.delete(`/api/credentials/${id}`, { params: { userId } });
      const updated = credentials.filter(c => c._id !== id);
      setCredentials(updated);
      setFilteredCredentials(filteredCredentials.filter(c => c._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete credential.');
    }
  };

  if (!isUnlocked) return null;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>My Vault</h1>
        <p>Manage your securely encrypted credentials</p>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <SearchBar onSearch={handleSearch} />

      {isLoading ? (
        <div className={styles.loading}>Loading your vault...</div>
      ) : (
        <VaultList 
          credentials={filteredCredentials} 
          onDelete={handleDelete} 
        />
      )}

      <Link href="/add" className={styles.fabBtn} title="Add Credential">
        +
      </Link>
    </div>
  );
}
