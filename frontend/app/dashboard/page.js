'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PinModal from '../../components/PinModal';
import SearchBar from '../../components/SearchBar';
import VaultList from '../../components/VaultList';
import { useVault } from '../../context/VaultContext';
import { decryptData, deriveKey } from '../../lib/crypto';
import api from '../../lib/api';
import {
  MAX_PIN_ATTEMPTS,
  clearStoredPin,
  getPinLockUntil,
  getStoredPinHash,
  hashPin,
  isValidPin,
  setPinLock,
  storePinHash,
} from '../../lib/pin';
import styles from './page.module.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'az', label: 'A to Z' },
  { value: 'za', label: 'Z to A' },
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
  const [pinMode, setPinMode] = useState('verify');
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);
  const [pinLockUntil, setPinLockUntil] = useState(0);
  const [pinHash, setPinHash] = useState('');
  const [pendingPinResolve, setPendingPinResolve] = useState(null);
  const [canResetPin, setCanResetPin] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [isVerifyingRecovery, setIsVerifyingRecovery] = useState(false);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);

  const { isUnlocked, userId, encryptionKey } = useVault();
  const router = useRouter();

  useEffect(() => {
    if (!isUnlocked) {
      router.push('/');
      return;
    }

    if (!userId || !encryptionKey) return;
    void fetchCredentials();
  }, [isUnlocked, userId, encryptionKey, router]);

  useEffect(() => {
    if (!isUnlocked) return;

    const nextHash = getStoredPinHash();
    const nextLockUntil = getPinLockUntil();
    setPinHash(nextHash);
    setPinLockUntil(nextLockUntil);

    if (!nextHash) {
      setPinMode('set');
      setPinModalOpen(true);
    }
  }, [isUnlocked]);

  const fetchCredentials = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/retrieve', { params: { userId } });
      const creds = await Promise.all(
        ((res.data.vaults || res.data.credentials || [])).map(async (credential) => {
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
    const totalUsage = credentials.reduce((sum, credential) => sum + (credential.usageCount || 0), 0);
    const platforms = [...new Set(credentials.map((credential) => credential.platform))].length;

    const lastActivity = credentials.reduce((latest, credential) => {
      const nextDate = new Date(credential.updatedAt || credential.createdAt);
      return nextDate > latest ? nextDate : latest;
    }, new Date(0));

    return { totalPasswords, totalUsage, platforms, lastActivity };
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

    const lowerQuery = query.toLowerCase();
    setFilteredCredentials(
      credentials.filter(
        (credential) =>
          credential.platform.toLowerCase().includes(lowerQuery) ||
          (credential.username && credential.username.toLowerCase().includes(lowerQuery))
      )
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this credential?')) return;

    try {
      await api.delete(`/api/credentials/${id}`, { params: { userId } });
      const updated = credentials.filter((credential) => credential._id !== id);
      setCredentials(updated);
      setFilteredCredentials(filteredCredentials.filter((credential) => credential._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      window.alert('Failed to delete credential.');
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

  const resolvePendingPin = (result) => {
    if (pendingPinResolve) {
      pendingPinResolve(result);
      setPendingPinResolve(null);
    }
  };

  const requestPinUnlock = () =>
    new Promise((resolve) => {
      const nextHash = getStoredPinHash();
      setPinHash(nextHash);
      setPinMode(nextHash ? 'verify' : 'set');
      setPinError('');
      setPendingPinResolve(() => resolve);
      setPinModalOpen(true);
    });

  const handleClosePinModal = () => {
    if (pinMode === 'set' && !pinHash) {
      return;
    }

    setPinModalOpen(false);
    setPinError('');
    resolvePendingPin(false);
  };

  const handlePinConfirm = async (pin) => {
    if (!isValidPin(pin)) {
      setPinError('PIN must be 4-6 digits and numeric only.');
      return;
    }

    if (pinMode === 'set') {
      const nextPinHash = await hashPin(pin);
      storePinHash(nextPinHash);
      setPinHash(nextPinHash);
      setPinAttempts(0);
      setPinLockUntil(0);
      setPinError('');
      setPinModalOpen(false);
      resolvePendingPin(true);
      return;
    }

    const currentLockUntil = getPinLockUntil();
    if (currentLockUntil) {
      setPinLockUntil(currentLockUntil);
      return;
    }

    const nextPinHash = await hashPin(pin);
    if (nextPinHash === getStoredPinHash()) {
      setPinAttempts(0);
      setPinError('');
      setPinModalOpen(false);
      resolvePendingPin(true);
      return;
    }

    const nextAttempts = pinAttempts + 1;
    setPinAttempts(nextAttempts);
    setPinError('Incorrect PIN');

    if (nextAttempts >= MAX_PIN_ATTEMPTS) {
      const lockUntil = setPinLock();
      setPinLockUntil(lockUntil);
      setPinAttempts(0);
    }
  };

  const handleVerifyRecoveryKey = async (event) => {
    event.preventDefault();
    if (!recoveryKey.trim()) {
      setRecoveryError('Recovery key is required.');
      return;
    }

    try {
      setIsVerifyingRecovery(true);
      setRecoveryError('');
      await api.post('/api/vault/verify-recovery', {
        recoveryKey: recoveryKey.trim(),
        userId,
      });
      setCanResetPin(true);
      setRecoveryModalOpen(false);
      setRecoveryKey('');
    } catch (err) {
      console.error(err);
      setRecoveryError(err?.response?.data?.error || 'Recovery key verification failed.');
    } finally {
      setIsVerifyingRecovery(false);
    }
  };

  if (!isUnlocked) return null;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>Vault</span>
            My Vault
          </h1>
          <p className={styles.subtitle}>Manage your securely encrypted credentials.</p>
        </div>
        <Link href="/add" className={styles.addBtn}>
          <span className={styles.addIcon}>+</span>
          Add Credential
        </Link>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.quickUnlockBanner}>
        <div className={styles.quickUnlockCopy}>
          <p className={styles.quickUnlockEyebrow}>Quick Unlock</p>
          <h2>{pinHash ? 'PIN shield is active' : 'Set your PIN shield'}</h2>
          <p>
            Use a 4-6 digit PIN to reveal and copy credentials faster without replacing your master password.
          </p>
        </div>
        <div className={styles.quickUnlockActions}>
          {!pinHash && (
            <button
              type="button"
              className={styles.pinActionBtn}
              onClick={() => {
                setPinMode('set');
                setPinError('');
                setPinModalOpen(true);
              }}
            >
              Set PIN
            </button>
          )}

          {pinHash && !canResetPin && (
            <button
              type="button"
              className={styles.pinGhostBtn}
              onClick={() => {
                setRecoveryError('');
                setRecoveryModalOpen(true);
              }}
            >
              Enter Recovery Key
            </button>
          )}

          {pinHash && canResetPin && (
            <button
              type="button"
              className={styles.pinActionBtn}
              onClick={() => {
                setPinMode('set');
                setPinError('');
                setPinModalOpen(true);
              }}
            >
              Reset PIN
            </button>
          )}
        </div>
      </div>

      {stats && !isLoading && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>Keys</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.totalPasswords}</span>
              <span className={styles.statLabel}>Total Passwords</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>Apps</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.platforms}</span>
              <span className={styles.statLabel}>Platforms</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>Use</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.totalUsage}</span>
              <span className={styles.statLabel}>Total Accesses</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>Last</div>
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
          <select className={styles.sortSelect} value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {searchQuery && (
        <div className={styles.searchMeta}>
          Showing {sortedCredentials.length} result{sortedCredentials.length !== 1 ? 's' : ''} for "{searchQuery}"
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
          requestPinUnlock={requestPinUnlock}
          pinEnabled={Boolean(pinHash)}
        />
      )}

      <Link href="/add" className={styles.fabBtn} title="Add Credential">
        +
      </Link>

      <PinModal
        isOpen={pinModalOpen}
        mode={pinMode}
        title={pinMode === 'set' ? 'Set your quick unlock PIN' : 'Enter PIN to view password'}
        description={
          pinMode === 'set'
            ? 'Create a 4-6 digit PIN for fast credential viewing. Your PIN is hashed before it is stored in this browser.'
            : 'This PIN only controls dashboard visibility. Your master password still handles encryption and decryption.'
        }
        confirmLabel={pinMode === 'set' ? 'Save PIN' : 'Unlock'}
        error={pinError}
        lockUntil={pinLockUntil}
        onClose={handleClosePinModal}
        onConfirm={handlePinConfirm}
        allowClose={pinMode !== 'set' || Boolean(pinHash)}
        showForgot={false}
      />

      {recoveryModalOpen && (
        <div className={styles.recoveryOverlay} role="presentation">
          <div className={styles.recoveryBackdrop} onClick={() => setRecoveryModalOpen(false)} />
          <div className={styles.recoveryModal} role="dialog" aria-modal="true" aria-labelledby="recovery-modal-title">
            <button
              type="button"
              className={styles.recoveryClose}
              onClick={() => setRecoveryModalOpen(false)}
              aria-label="Close recovery verification modal"
            >
              x
            </button>

            <p className={styles.quickUnlockEyebrow}>Recovery Gate</p>
            <h3 id="recovery-modal-title" className={styles.recoveryTitle}>
              Verify recovery key to reset PIN
            </h3>
            <p className={styles.recoveryText}>
              Enter the recovery key generated when this vault account was created. Reset PIN appears only after this verification.
            </p>

            <form onSubmit={handleVerifyRecoveryKey} className={styles.recoveryForm}>
              <input
                type="text"
                className={`input-field ${styles.recoveryInput}`}
                placeholder="Paste recovery key"
                value={recoveryKey}
                onChange={(event) => setRecoveryKey(event.target.value)}
                autoFocus
              />

              {recoveryError && <div className={styles.recoveryError}>{recoveryError}</div>}

              <div className={styles.recoveryActions}>
                <button type="button" className={styles.pinGhostBtn} onClick={() => setRecoveryModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.pinActionBtn} disabled={isVerifyingRecovery}>
                  {isVerifyingRecovery ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
