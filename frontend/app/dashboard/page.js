'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVault } from '../../context/VaultContext';
import SearchBar from '../../components/SearchBar';
import VaultList from '../../components/VaultList';
import api from '../../lib/api';
import { decryptData, deriveKey } from '../../lib/crypto';
import styles from './page.module.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
  { value: 'mostUsed', label: 'Most Used' },
  { value: 'recentlyUsed', label: 'Recently Used' },
];

export default function DashboardPage() {
  const [credentials, setCredentials] = useState([]);
  const [filteredCredentials, setFilteredCredentials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const { isUnlocked, userId, encryptionKey } = useVault();
  const router = useRouter();

  useEffect(() => {
    if (!isUnlocked) {
      router.push('/');
      return;
    }
    if (!userId || !encryptionKey) return;
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

  const stats = useMemo(() => {
    if (!credentials.length) return null;
    const totalPasswords = credentials.length;
    const totalUsage = credentials.reduce((sum, c) => sum + (c.usageCount || 0), 0);
    const platforms = [...new Set(credentials.map(c => c.platform))].length;

    const lastActivity = credentials.reduce((latest, c) => {
      const d = new Date(c.updatedAt || c.createdAt);
      return d > latest ? d : latest;
    }, new Date(0));

    const mostUsed = credentials.reduce((top, c) =>
      (c.usageCount || 0) > (top?.usageCount || 0) ? c : top
    , credentials[0]);

    return { totalPasswords, totalUsage, platforms, lastActivity, mostUsed };
  }, [credentials]);

  const sortedCredentials = useMemo(() => {
    const list = [...filteredCredentials];
    switch (sortBy) {
      case 'newest':
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'az':
        return list.sort((a, b) => a.platform.localeCompare(b.platform));
      case 'za':
        return list.sort((a, b) => b.platform.localeCompare(a.platform));
      case 'mostUsed':
        return list.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
      case 'recentlyUsed':
        return list.sort((a, b) => new Date(b.lastUsed || 0) - new Date(a.lastUsed || 0));
      default:
        return list;
    }
  }, [filteredCredentials, sortBy]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredCredentials(credentials);
      return;
    }
    const lowerQ = query.toLowerCase();
    setFilteredCredentials(
      credentials.filter(c =>
        c.platform.toLowerCase().includes(lowerQ) ||
        (c.username && c.username.toLowerCase().includes(lowerQ))
      )
    );
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

  const formatTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (!isUnlocked) return null;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>🛡️</span>
            My Vault
          </h1>
          <p className={styles.subtitle}>Manage your securely encrypted credentials</p>
        </div>
        <Link href="/add" className={styles.addBtn}>
          <span className={styles.addIcon}>+</span>
          Add Credential
        </Link>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {stats && !isLoading && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔑</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.totalPasswords}</span>
              <span className={styles.statLabel}>Total Passwords</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🌐</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.platforms}</span>
              <span className={styles.statLabel}>Platforms</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.totalUsage}</span>
              <span className={styles.statLabel}>Total Accesses</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏱️</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatTimeAgo(stats.lastActivity)}</span>
              <span className={styles.statLabel}>Last Activity</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.toolbar}>
        <SearchBar onSearch={handleSearch} />
        <div className={styles.controls}>
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ▦
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {searchQuery && (
        <div className={styles.searchMeta}>
          Showing {sortedCredentials.length} result{sortedCredentials.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
        </div>
      )}

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Decrypting your vault...</p>
        </div>
      ) : (
        <VaultList
          credentials={sortedCredentials}
          onDelete={handleDelete}
          viewMode={viewMode}
        />
      )}

      <Link href="/add" className={styles.fabBtn} title="Add Credential">
        +
      </Link>
    </div>
  );
}
