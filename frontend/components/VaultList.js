'use client';

import CredentialCard from './CredentialCard';
import styles from './VaultList.module.css';

export default function VaultList({ credentials, onDelete }) {
  if (!credentials || credentials.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📭</div>
        <h2>Your vault is empty</h2>
        <p>Add your first credential to get started with SecureVault.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {credentials.map(cred => (
        <CredentialCard 
          key={cred._id} 
          credential={cred} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  );
}
