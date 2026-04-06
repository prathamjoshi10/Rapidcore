'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { decryptData, deriveKey } from '../lib/crypto';
import { useVault } from '../context/VaultContext';
import styles from './CredentialCard.module.css';

const AUTO_HIDE_MS = 45 * 1000;

export default function CredentialCard({
  credential,
  onDelete,
  requestPinUnlock,
  pinEnabled = false,
  viewMode = 'grid',
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [unlockNotice, setUnlockNotice] = useState('');
  const { encryptionKey } = useVault();
  const hideTimerRef = useRef(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleAutoHide = () => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setShowPassword(false);
      setDecryptedPassword('');
      setUnlockNotice('');
    }, AUTO_HIDE_MS);
  };

  useEffect(() => () => clearHideTimer(), []);

  const handleTogglePassword = async () => {
    if (showPassword) {
      clearHideTimer();
      setShowPassword(false);
      setDecryptedPassword('');
      setUnlockNotice('');
      return;
    }

    if (pinEnabled && requestPinUnlock) {
      const isAllowed = await requestPinUnlock();
      if (!isAllowed) return;
    }

    setIsDecrypting(true);
    try {
      const key = await deriveKey(encryptionKey, credential.salt);
      const plaintext = await decryptData(credential.encryptedPassword, credential.iv, key);
      setDecryptedPassword(plaintext);
      setShowPassword(true);
      setUnlockNotice('Quick unlocked. Password hides again in 45 seconds.');
      scheduleAutoHide();
    } catch (err) {
      console.error(err);
      setDecryptedPassword('ERROR');
    } finally {
      setIsDecrypting(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      let password = decryptedPassword;

      if (!showPassword) {
        if (pinEnabled && requestPinUnlock) {
          const isAllowed = await requestPinUnlock();
          if (!isAllowed) return;
        }

        const key = await deriveKey(encryptionKey, credential.salt);
        password = await decryptData(credential.encryptedPassword, credential.iv, key);
        setDecryptedPassword(password);
        setShowPassword(true);
        setUnlockNotice('Quick unlocked. Password hides again in 45 seconds.');
        scheduleAutoHide();
      }

      await navigator.clipboard.writeText(password);
      setCopyStatus('Copied!');
      window.setTimeout(() => setCopyStatus(''), 2000);
    } catch (err) {
      console.error(err);
      setCopyStatus('Failed to copy');
      window.setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  return (
    <div className={`card ${styles.card} ${viewMode === 'list' ? styles.cardList : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.platform}>{credential.platform}</h3>
        <div className={styles.actions}>
          <Link href={`/credential/${credential._id}`} className={styles.iconBtn} title="View/Edit">
            Edit
          </Link>
          <button type="button" onClick={() => onDelete(credential._id)} className={styles.iconBtn} title="Delete">
            Delete
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.username}>
          <span className={styles.label}>Username:</span> {credential.username || 'Not set'}
        </p>
        <div className={styles.passwordField}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={showPassword ? decryptedPassword : '************'}
            readOnly
            className={styles.passwordInput}
          />
          <button
            type="button"
            onClick={handleTogglePassword}
            className={styles.toggleBtn}
            disabled={isDecrypting}
          >
            {isDecrypting ? '...' : showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {unlockNotice && <p className={styles.unlockNotice}>{unlockNotice}</p>}
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={copyToClipboard} className={styles.footerBtn}>
          {copyStatus || 'Copy Password'}
        </button>
        {credential.platformUrl && (
          <a href={credential.platformUrl} target="_blank" rel="noopener noreferrer" className={styles.footerBtn}>
            Open App
          </a>
        )}
      </div>
    </div>
  );
}
