'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVault } from '../context/VaultContext';
import styles from './page.module.css';

export default function LoginPage() {
  const [masterPassword, setMasterPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { unlockVault, isUnlocked } = useVault();
  const router = useRouter();

  // If already unlocked, redirect to dashboard
  useEffect(() => {
    if (isUnlocked) {
      router.push('/dashboard');
    }
  }, [isUnlocked, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!masterPassword) return;

    setIsSubmitting(true);
    try {
      await unlockVault(masterPassword);
      // Let context take over, useEffect will intercept isUnlocked and redirect
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  if (isUnlocked) return null; // Avoid flicker while redirecting

  return (
    <div className={styles.loginContainer}>
      <div className={`card ${styles.loginCard}`}>
        <div className={styles.header}>
          <div className={styles.lockIcon}>🔐</div>
          <h1>Unlock Vault</h1>
          <p>Enter your master password to decrypt your secure vault.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="password"
              className="input-field"
              placeholder="Master Password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          
          <button 
            type="submit" 
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={isSubmitting || !masterPassword}
          >
            {isSubmitting ? 'Unlocking...' : 'Unlock Vault'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>Your master password is never sent to the server. If you lose it, your data cannot be recovered.</p>
        </div>
      </div>
    </div>
  );
}
