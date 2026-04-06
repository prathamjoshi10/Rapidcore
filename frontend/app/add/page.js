'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVault } from '../../context/VaultContext';
import { encryptData, generateSalt, deriveKey } from '../../lib/crypto';
import api from '../../lib/api';
import styles from './page.module.css';

export default function AddCredentialPage() {
  const [formData, setFormData] = useState({
    platform: '',
    platformUrl: '',
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isUnlocked, userId, encryptionKey } = useVault();
  const router = useRouter();

  useEffect(() => {
    if (!isUnlocked) {
      router.push('/');
    }
  }, [isUnlocked, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let pwd = "";
    for (let i = 0; i < 16; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: pwd });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.platform || !formData.password) return;

    setIsSubmitting(true);
    try {
      // 1. Generate salt for this credential
      const salt = await generateSalt();
      
      // 2. Derive key from master password using this specific salt
      const cryptoKey = await deriveKey(encryptionKey, salt);
      
      // 3. Encrypt password and username
      const { cipherHex: encryptedPassword, ivHex: passwordIv } = await encryptData(formData.password, cryptoKey);
      const { cipherHex: encryptedUsername, ivHex: usernameIv } = await encryptData(formData.username || '', cryptoKey);
      
      // 4. Send to backend
      const payload = {
        userId,
        platform: formData.platform,
        platformUrl: formData.platformUrl,
        username: '',
        encryptedPassword,
        iv: passwordIv,
        encryptedUsername,
        usernameIv,
        salt
      };

      await api.post('/api/credentials', payload);
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to save credential:', err);
      alert('Failed to save credential. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!isUnlocked) return null;

  return (
    <div className={styles.addContainer}>
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.backBtn}>← Back to Vault</Link>
        <h1>Add Credential</h1>
      </div>

      <div className={`card ${styles.formCard}`}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="platform">Platform Name*</label>
            <input
              id="platform"
              name="platform"
              className="input-field"
              type="text"
              placeholder="e.g. GitHub, Google"
              value={formData.platform}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="platformUrl">Website URL</label>
            <input
              id="platformUrl"
              name="platformUrl"
              className="input-field"
              type="url"
              placeholder="e.g. https://github.com"
              value={formData.platformUrl}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="username">Username / Email</label>
            <input
              id="username"
              name="username"
              className="input-field"
              type="text"
              placeholder="e.g. user@example.com"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password*</label>
            <div className={styles.passwordField}>
              <input
                id="password"
                name="password"
                className="input-field"
                type="text"
                placeholder="Enter or generate password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button type="button" onClick={generatePassword} className={`btn ${styles.genBtn}`}>
                Generate
              </button>
            </div>
          </div>

          <div className={styles.actions}>
            <button 
              type="submit" 
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={isSubmitting || !formData.platform || !formData.password}
            >
              {isSubmitting ? 'Encrypting...' : 'Save to Vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
