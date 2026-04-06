'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVault } from '../../context/VaultContext';
import SearchBar from '../../components/SearchBar';
import VaultList from '../../components/VaultList';
import api from '../../lib/api';
import styles from './page.module.css';

export default function DashboardPage() {
  const [credentials, setCredentials] = useState([]);
  const [filteredCredentials, setFilteredCredentials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { isUnlocked, userId } = useVault();
  const router = useRouter();

  useEffect(() => {
    if (!isUnlocked) {
      router.push('/');
      return;
    }

    fetchCredentials();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked, userId]);

  const fetchCredentials = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/credentials?userId=${userId}`);
      const creds = res.data.credentials || [];
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
      // You can do local filtering if desired, or API filtering:
      // Client-side filtering is faster for small lists:
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
      await api.delete(`/api/credentials/${id}`);
      // Remove locally
      const updated = credentials.filter(c => c._id !== id);
      setCredentials(updated);
      setFilteredCredentials(filteredCredentials.filter(c => c._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete credential.');
    }
  };

  if (!isUnlocked) return null; // Avoid UI flicker before redirect

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
