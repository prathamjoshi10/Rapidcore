'use client';

import Link from 'next/link';
import { useVault } from '../context/VaultContext';

export default function Navbar() {
  const { isUnlocked, lockVault } = useVault();

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: 'var(--nav-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      maxWidth: 'var(--max-width)',
      margin: '0 auto',
      background: 'rgba(27, 27, 32, 0.6)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <Link href={isUnlocked ? '/dashboard' : '/'} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        textDecoration: 'none',
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
          fontSize: '1rem',
        }}>
          🛡️
        </span>
        <span style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          SecureVault
        </span>
      </Link>

      {isUnlocked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--tertiary)',
            animation: 'breathe 2s ease-in-out infinite',
            boxShadow: '0 0 6px rgba(255, 183, 133, 0.4)',
          }} title="Zero-knowledge active" />
          <button
            onClick={lockVault}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-btn)',
              background: 'rgba(255, 180, 171, 0.08)',
              color: 'var(--error)',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: '1px solid rgba(255, 180, 171, 0.15)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(255, 180, 171, 0.16)';
              e.target.style.borderColor = 'rgba(255, 180, 171, 0.3)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'rgba(255, 180, 171, 0.08)';
              e.target.style.borderColor = 'rgba(255, 180, 171, 0.15)';
            }}
          >
            Lock Vault
          </button>
        </div>
      )}
    </nav>
  );
}
