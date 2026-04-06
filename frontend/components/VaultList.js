'use client';

import CredentialCard from './CredentialCard';
import styles from './VaultList.module.css';

export default function VaultList({
  credentials,
  onDelete,
  viewMode = 'grid',
  requestPinUnlock,
  pinEnabled,
}) {
  if (!credentials || credentials.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>Vault</div>
        <h2>Your vault is empty</h2>
        <p>Add your first credential to get started with SecureVault.</p>
      </div>
    );
  }

  return (
    <div className={viewMode === 'list' ? styles.list : styles.grid}>
      {credentials.map((credential) => (
        <CredentialCard
          key={credential._id}
          credential={credential}
          onDelete={onDelete}
          viewMode={viewMode}
          requestPinUnlock={requestPinUnlock}
          pinEnabled={pinEnabled}
        />
      ))}
    </div>
  );
}
