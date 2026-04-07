'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVault } from '../../context/VaultContext';
import styles from './page.module.css';

export default function AddCredentialPage() {
  const [formData, setFormData] = useState({
    platform: '',
    platformUrl: '',
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isUnlocked, addCredential } = useVault();
  const router = useRouter();

  useEffect(() => {
    if (!isUnlocked) {
      router.push('/');
    }
  }, [isUnlocked, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.platform || !formData.password) return;

    setIsSubmitting(true);
    try {
      await addCredential({
        platform: formData.platform,
        platformUrl: formData.platformUrl,
        username: formData.username,
        password: formData.password,
      });
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
            <input
              id="password"
              name="password"
              className="input-field"
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.actions}>
            <button 
              type="submit" 
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={isSubmitting || !formData.platform || !formData.password}
            >
              {isSubmitting ? 'Encrypting & Saving...' : 'Save to Vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
