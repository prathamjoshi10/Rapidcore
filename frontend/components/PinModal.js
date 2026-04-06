'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './PinModal.module.css';

function getDigits(value) {
  return value.replace(/\D/g, '').slice(0, 6);
}

function getVisibleSlots(value) {
  return value.padEnd(4, ' ').slice(0, Math.max(4, value.length));
}

export default function PinModal({
  isOpen,
  mode,
  title,
  description,
  confirmLabel,
  error,
  lockUntil,
  onClose,
  onConfirm,
  allowClose = true,
  showForgot = false,
  onForgotPin,
}) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setConfirmPin('');
      setIsSubmitting(false);
      setSecondsRemaining(0);
      return;
    }

    inputRef.current?.focus();
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen || !lockUntil) {
      setSecondsRemaining(0);
      return;
    }

    const tick = () => {
      const nextValue = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setSecondsRemaining(nextValue);
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [isOpen, lockUntil]);

  const isLocked = secondsRemaining > 0;
  const visiblePin = useMemo(() => getVisibleSlots(pin), [pin]);
  const visibleConfirmPin = useMemo(() => getVisibleSlots(confirmPin), [confirmPin]);
  const pinsMatch = mode !== 'set' || pin === confirmPin;
  const canSubmit =
    !isLocked &&
    !isSubmitting &&
    pin.length >= 4 &&
    pin.length <= 6 &&
    pinsMatch &&
    (mode !== 'set' || confirmPin.length >= 4);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      await onConfirm(pin);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.backdrop} onClick={allowClose ? onClose : undefined} />
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="pin-modal-title">
        {allowClose && (
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close PIN modal">
            x
          </button>
        )}

        <div className={styles.header}>
          <p className={styles.eyebrow}>Quick Unlock</p>
          <h2 id="pin-modal-title">{title}</h2>
          <p className={styles.description}>{description}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>{mode === 'set' ? 'Create PIN' : 'Enter PIN'}</span>
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={styles.hiddenInput}
              value={pin}
              onChange={(event) => setPin(getDigits(event.target.value))}
              maxLength={6}
              disabled={isLocked || isSubmitting}
            />
            <div className={styles.pinBoxes}>
              {visiblePin.split('').map((_, index) => (
                <div
                  key={`${mode}-pin-${index}`}
                  className={`${styles.pinBox} ${index === Math.min(pin.length, visiblePin.length - 1) ? styles.pinBoxActive : ''}`}
                >
                  {index < pin.length ? '*' : ''}
                </div>
              ))}
            </div>
          </label>

          {mode === 'set' && (
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Confirm PIN</span>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                className={styles.hiddenInput}
                value={confirmPin}
                onChange={(event) => setConfirmPin(getDigits(event.target.value))}
                maxLength={6}
                disabled={isLocked || isSubmitting}
              />
              <div className={styles.pinBoxes}>
                {visibleConfirmPin.split('').map((_, index) => (
                  <div
                    key={`confirm-pin-${index}`}
                    className={`${styles.pinBox} ${index === Math.min(confirmPin.length, visibleConfirmPin.length - 1) ? styles.pinBoxActive : ''}`}
                  >
                    {index < confirmPin.length ? '*' : ''}
                  </div>
                ))}
              </div>
            </label>
          )}

          <div className={styles.helperRow}>
            <span>4-6 digits, numbers only</span>
            {mode === 'set' && pin && confirmPin && !pinsMatch && (
              <span className={styles.errorText}>PINs do not match</span>
            )}
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}
          {isLocked && <div className={styles.lockBanner}>Too many attempts. Try again in {secondsRemaining}s.</div>}

          <div className={styles.actions}>
            {showForgot && onForgotPin && (
              <button type="button" className={styles.secondaryButton} onClick={onForgotPin}>
                Forgot PIN
              </button>
            )}
            <button type="submit" className={styles.primaryButton} disabled={!canSubmit}>
              {isSubmitting ? 'Please wait...' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
