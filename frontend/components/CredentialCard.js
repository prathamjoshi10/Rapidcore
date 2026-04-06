'use client';

import { useState } from 'react';
import Link from 'next/link';
import { decryptData } from '../lib/crypto';
import { useVault } from '../context/VaultContext';
import styles from './CredentialCard.module.css';

export default function CredentialCard({ credential, onDelete }) {
  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const { encryptionKey } = useVault();



  // Rewrite handleDecrypt properly:
  const handleTogglePassword = async () => {
    if (showPassword) {
      setShowPassword(false);
      setDecryptedPassword('');
      return;
    }

    setIsDecrypting(true);
    try {
      // Lazy import deriveKey so we don't cause circular issues if any
      const { deriveKey } = await import('../lib/crypto');
      const key = await deriveKey(encryptionKey, credential.salt);
      const plaintext = await decryptData(credential.encryptedPassword, credential.iv, key);
      
      if (plaintext) {
        setDecryptedPassword(plaintext);
        setShowPassword(true);
      } else {
        setDecryptedPassword('ERROR: Bad Key');
      }
    } catch (err) {
      console.error(err);
      setDecryptedPassword('ERROR');
    }
    setIsDecrypting(false);
  };

  const copyToClipboard = async () => {
    try {
      let pwd = decryptedPassword;
      if (!showPassword) {
        // Decrypt silently just to copy
        const { deriveKey } = await import('../lib/crypto');
        const key = await deriveKey(encryptionKey, credential.salt);
        pwd = await decryptData(credential.encryptedPassword, credential.iv, key);
      }
      
      await navigator.clipboard.writeText(pwd);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (err) {
      setCopyStatus('Failed to copy');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.header}>
        <h3 className={styles.platform}>{credential.platform}</h3>
        <div className={styles.actions}>
          <Link href={`/credential/${credential._id}`} className={styles.iconBtn} title="View/Edit">
            ✏️
          </Link>
          <button onClick={() => onDelete(credential._id)} className={styles.iconBtn} title="Delete">
            🗑️
          </button>
        </div>
      </div>
      
      <div className={styles.body}>
        <p className={styles.username}>
          <span className={styles.label}>Username:</span> {credential.username}
        </p>
        <div className={styles.passwordField}>
          <input 
            type={showPassword ? 'text' : 'password'} 
            value={showPassword ? decryptedPassword : '••••••••••••'} 
            readOnly 
            className={styles.passwordInput}
          />
          <button 
            type="button" 
            onClick={handleTogglePassword} 
            className={styles.toggleBtn}
            disabled={isDecrypting}
          >
            {isDecrypting ? '...' : (showPassword ? 'Hide' : 'Show')}
          </button>
        </div>
      </div>

      <div className={styles.footer}>
        <button onClick={copyToClipboard} className={styles.footerBtn}>
          📋 {copyStatus || 'Copy Password'}
        </button>
        {credential.platformUrl && (
          <a href={credential.platformUrl} target="_blank" rel="noopener noreferrer" className={styles.footerBtn}>
            🌍 Open App
          </a>
        )}
      </div>
    </div>
  );
}
