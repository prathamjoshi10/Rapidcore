'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVault } from '../context/VaultContext';
import styles from './page.module.css';

const MENU_OPTIONS = [
  {
    id: 'unlock',
    eyebrow: 'Access',
    title: 'Unlock Vault',
    description: 'Open your encrypted vault with your existing master key.',
    buttonLabel: 'Unlock Vault',
  },
  {
    id: 'create',
    eyebrow: 'Onboard',
    title: 'Create Vault Account',
    description: 'Set a new master key and start with a fresh encrypted vault.',
    buttonLabel: 'Create Vault Account',
  },
  {
    id: 'reset',
    eyebrow: 'Recovery',
    title: 'Reset Password',
    description: 'Create a brand-new vault when your previous master key is no longer available.',
    buttonLabel: 'Reset Password',
  },
];

const LEET_MAP = {
  a: ['4', '@'],
  e: ['3'],
  i: ['1', '!'],
  l: ['1'],
  o: ['0'],
  s: ['5', '$'],
  t: ['7'],
};

function toBaseSeed(password) {
  return password.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
}

function strengthenPasswordVariant(seed, variantIndex) {
  const cleaned = toBaseSeed(seed);
  const base = cleaned || 'VaultKey';
  const chars = base.split('');

  const transformed = chars.map((char, index) => {
    const lower = char.toLowerCase();
    const replacements = LEET_MAP[lower];

    if (replacements && (index + variantIndex) % 2 === 0) {
      return replacements[(index + variantIndex) % replacements.length];
    }

    if (index % 2 === variantIndex % 2) {
      return char.toUpperCase();
    }

    return char.toLowerCase();
  });

  const prefixOptions = ['#', '$', 'Z!', 'Q@'];
  const suffixOptions = ['!2pQ', '@91X', '#73Lp', '!Vault9'];
  const joiners = ['#', '!', '-', '@'];
  const pivot = Math.max(2, Math.ceil(transformed.length / 2));

  const left = transformed.slice(0, pivot).join('');
  const right = transformed.slice(pivot).join('');

  return `${prefixOptions[variantIndex]}${left}${joiners[variantIndex]}${right}${suffixOptions[variantIndex]}`;
}

function getPasswordRecommendations(password) {
  if (!password.trim()) return [];

  return [0, 1, 2]
    .map((variantIndex) => strengthenPasswordVariant(password, variantIndex))
    .filter((value, index, values) => values.indexOf(value) === index);
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('unlock');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { unlockVault, isUnlocked } = useVault();
  const router = useRouter();

  useEffect(() => {
    if (isUnlocked) {
      router.push('/dashboard');
    }
  }, [isUnlocked, router]);

  useEffect(() => {
    setMasterPassword('');
    setConfirmPassword('');
    setRecoveryKey('');
    setIsSubmitting(false);
    setError('');
  }, [activeTab]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!masterPassword) return;

    setIsSubmitting(true);
    setError('');

    try {
      await unlockVault(masterPassword);
    } catch (err) {
      console.error(err);
      setError('Failed to unlock vault. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!masterPassword || !confirmPassword) return;

    if (masterPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (masterPassword.length < 6) {
      setError('Master password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await unlockVault(masterPassword);
    } catch (err) {
      console.error(err);
      setError('Failed to create vault. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!recoveryKey || !masterPassword || !confirmPassword) return;

    if (masterPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (masterPassword.length < 6) {
      setError('New master password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await unlockVault(masterPassword);
    } catch (err) {
      console.error(err);
      setError('Failed to reset vault. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isUnlocked) return null;

  const activeOption = MENU_OPTIONS.find((option) => option.id === activeTab);
  const passwordRecommendations = getPasswordRecommendations(masterPassword);

  const handleRecommendationClick = (password) => {
    setMasterPassword(password);
    setConfirmPassword(password);
    setError('');
  };

  const renderPasswordRecommendations = () => (
    <div className={styles.recommendations}>
      <div className={styles.recommendationHeader}>
        <div>
          <p className={styles.recommendationEyebrow}>Stronger Options</p>
          <h3>Pick a secure master password suggestion</h3>
        </div>
        <p className={styles.recommendationText}>
          Suggestions are generated from what you typed and upgraded with stronger patterns. Clicking Use fills both password fields instantly.
        </p>
      </div>

      <div className={styles.recommendationList}>
        {passwordRecommendations.map((password) => (
          <div key={password} className={styles.recommendationRow}>
            <span className={styles.recommendationValue}>{password}</span>
            <button
              type="button"
              className={styles.useButton}
              onClick={() => handleRecommendationClick(password)}
            >
              Use
            </button>
          </div>
        ))}
      </div>

      <div className={styles.recommendationTips}>
        <span>Use 14+ characters for a stronger master password.</span>
        <span>Avoid names, birthdays, and reused passwords from other apps.</span>
      </div>
    </div>
  );

  return (
    <div className={styles.loginContainer}>
      <div className={`card ${styles.loginCard}`}>
        <div className={styles.hero}>
          <h1>SecureVault</h1>
          <p className={styles.heroText}>Unlock, create, or reset your vault.</p>
        </div>

        <div className={styles.mainMenu} role="tablist" aria-label="Master key actions">
          {MENU_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.menuOption} ${activeTab === option.id ? styles.menuOptionActive : ''}`}
              onClick={() => setActiveTab(option.id)}
            >
              <span className={styles.menuTitle}>{option.title}</span>
            </button>
          ))}
        </div>

        <div className={styles.panel}>
          <div className={styles.header}>
            <p className={styles.sectionLabel}>{activeOption?.buttonLabel}</p>

            {activeTab === 'unlock' && (
              <>
                <h2>Unlock with your master key</h2>
                <p>Enter your master password to decrypt your secure vault.</p>
              </>
            )}

            {activeTab === 'create' && (
              <>
                <h2>Create a vault account</h2>
                <p>Choose a strong master password. It encrypts your vault locally in the browser.</p>
              </>
            )}

            {activeTab === 'reset' && (
              <>
                <h2>Reset your password</h2>
                <p className={styles.warningText}>
                  Enter your recovery key first. New password creation is only available after that step.
                </p>
              </>
            )}
          </div>

          {activeTab === 'unlock' && (
            <form onSubmit={handleUnlock} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="unlock-password" className={styles.fieldLabel}>
                  Master Password
                </label>
                <input
                  id="unlock-password"
                  type="password"
                  className="input-field"
                  placeholder="Enter your master password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {error && <div className={styles.errorMsg}>{error}</div>}

              <button
                type="submit"
                className={`btn btn-primary ${styles.submitBtn}`}
                disabled={isSubmitting || !masterPassword}
              >
                {isSubmitting ? 'Unlocking...' : 'Unlock Vault'}
              </button>
            </form>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreate} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="create-password" className={styles.fieldLabel}>
                  Master Password
                </label>
                <input
                  id="create-password"
                  type="password"
                  className="input-field"
                  placeholder="Create a master password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  autoFocus
                  required
                  minLength={6}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirm-create-password" className={styles.fieldLabel}>
                  Confirm Master Password
                </label>
                <input
                  id="confirm-create-password"
                  type="password"
                  className="input-field"
                  placeholder="Confirm your master password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {masterPassword && (
                <div className={styles.strengthWrap}>
                  <div className={styles.strengthBar}>
                    <div
                      className={styles.strengthFill}
                      style={{
                        width: masterPassword.length >= 12 ? '100%' : masterPassword.length >= 8 ? '66%' : '33%',
                        background:
                          masterPassword.length >= 12
                            ? 'var(--success)'
                            : masterPassword.length >= 8
                              ? '#f0a500'
                              : 'var(--danger)',
                      }}
                    />
                  </div>
                  <span className={styles.strengthLabel}>
                    Strength: {masterPassword.length >= 12 ? 'Strong' : masterPassword.length >= 8 ? 'Medium' : 'Weak'}
                  </span>
                </div>
              )}

              {passwordRecommendations.length > 0 && renderPasswordRecommendations()}

              {error && <div className={styles.errorMsg}>{error}</div>}

              <button
                type="submit"
                className={`btn btn-primary ${styles.submitBtn}`}
                disabled={isSubmitting || !masterPassword || !confirmPassword}
              >
                {isSubmitting ? 'Creating...' : 'Create Vault Account'}
              </button>
            </form>
          )}

          {activeTab === 'reset' && (
            <>
              <div className={styles.warningBanner}>
                <span className={styles.warningBadge}>Important</span>
                <span>Reset is locked until a recovery key is entered.</span>
              </div>

              <form onSubmit={handleReset} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="recovery-key" className={styles.fieldLabel}>
                    Recovery Key
                  </label>
                  <input
                    id="recovery-key"
                    type="text"
                    className="input-field"
                    placeholder="Enter your recovery key"
                    value={recoveryKey}
                    onChange={(e) => setRecoveryKey(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                {!recoveryKey.trim() && (
                  <div className={styles.helperText}>
                    Password reset fields will appear after you enter a recovery key.
                  </div>
                )}

                {recoveryKey.trim() && (
                  <>
                    <div className={styles.inputGroup}>
                  <label htmlFor="reset-password" className={styles.fieldLabel}>
                    New Master Password
                  </label>
                  <input
                    id="reset-password"
                    type="password"
                    className="input-field"
                    placeholder="Create a new master password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    autoFocus
                    required
                    minLength={6}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="confirm-reset-password" className={styles.fieldLabel}>
                    Confirm New Master Password
                  </label>
                  <input
                    id="confirm-reset-password"
                    type="password"
                    className="input-field"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                {masterPassword && (
                  <div className={styles.strengthWrap}>
                    <div className={styles.strengthBar}>
                      <div
                        className={styles.strengthFill}
                        style={{
                          width: masterPassword.length >= 12 ? '100%' : masterPassword.length >= 8 ? '66%' : '33%',
                          background:
                            masterPassword.length >= 12
                              ? 'var(--success)'
                              : masterPassword.length >= 8
                                ? '#f0a500'
                                : 'var(--danger)',
                        }}
                      />
                    </div>
                    <span className={styles.strengthLabel}>
                      Strength: {masterPassword.length >= 12 ? 'Strong' : masterPassword.length >= 8 ? 'Medium' : 'Weak'}
                    </span>
                  </div>
                )}
                  </>
                )}

                {error && <div className={styles.errorMsg}>{error}</div>}

                <button
                  type="submit"
                  className={`btn btn-danger ${styles.submitBtn}`}
                  disabled={isSubmitting || !recoveryKey.trim() || !masterPassword || !confirmPassword}
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <p>Your master password is never sent to the server. All encryption happens locally in your browser.</p>
        </div>
      </div>
    </div>
  );
}
