'use client';

import Link from 'next/link';
import { useVault } from '../context/VaultContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { isUnlocked, lockVault } = useVault();

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.brand}>
          <span className={styles.icon}>🔐</span>
          SecureVault
        </Link>
        
        {isUnlocked && (
          <div className={styles.navLinks}>
            <Link href="/dashboard" className={styles.link}>
              Dashboard
            </Link>
            <button onClick={lockVault} className={`btn btn-danger ${styles.lockBtn}`}>
              🔒 Lock Vault
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
