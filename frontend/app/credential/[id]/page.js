'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useVault } from '../../../context/VaultContext';
import { encryptData, decryptData, deriveKey } from '../../../lib/crypto';
import api from '../../../lib/api';
import styles from './page.module.css';

export default function CredentialDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isUnlocked, userId, encryptionKey } = useVault();

  const [credential, setCredential] = useState(null);
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isUnlocked) {
      router.push('/');
      return;
    }

    if (!userId || !encryptionKey) {
      return;
    }

    fetchCredential();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isUnlocked, userId, encryptionKey]);

  const fetchCredential = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/credentials/${id}`, { params: { userId } });
      const data = res.data.credential || res.data;

      const cryptoKey = await deriveKey(encryptionKey, data.salt);
      const decUsername = data.encryptedUsername && data.usernameIv
        ? await decryptData(data.encryptedUsername, data.usernameIv, cryptoKey)
        : '';
      const decPwd = await decryptData(data.encryptedPassword, data.iv, cryptoKey);

      data.username = decUsername;
      data.password = decPwd || "ERROR: Could not decrypt";

      setCredential(data);
      setFormData({
        platform: data.platform,
        platformUrl: data.platformUrl || '',
        username: data.username || '',
        password: data.password
      });

      // Track usage
      await api.patch(`/api/credentials/${id}/track`, { userId }).catch(() => {});
    } catch (err) {
      console.error(err);
      setError('Failed to load credential');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const cryptoKey = await deriveKey(encryptionKey, credential.salt);
      const { cipherHex: encryptedPassword, ivHex: passwordIv } = await encryptData(formData.password, cryptoKey);
      const { cipherHex: encryptedUsername, ivHex: usernameIv } = await encryptData(formData.username || '', cryptoKey);

      const payload = {
        userId,
        platform: formData.platform,
        platformUrl: formData.platformUrl,
        username: '',
        encryptedUsername,
        usernameIv,
        encryptedPassword,
        iv: passwordIv
      };

      await api.put(`/api/credentials/${id}`, payload);
      
      setCredential({ ...credential, ...payload, username: formData.username, password: formData.password });
      setIsEditing(false);
      alert('Updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to completely delete this credential?')) return;
    
    try {
      await api.delete(`/api/credentials/${id}`, { params: { userId } });
      router.push('/dashboard');
    } catch (err) {
      alert('Failed to delete');
    }
  };

  if (!isUnlocked) return null;
  if (isLoading) return <div className={styles.loading}>Loading credential...</div>;
  if (error || !credential) return <div className={styles.error}>{error || 'Not found'}</div>;

  return (
    <div className={styles.detailContainer}>
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.backBtn}>← Back to Vault</Link>
        <div className={styles.headerActions}>
          <h1>{isEditing ? 'Edit' : 'View'} Credential</h1>
          {!isEditing && (
            <div className={styles.btnGroup}>
              <button className="btn" onClick={() => setIsEditing(true)}>Edit</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          )}
        </div>
      </div>

      <div className={`card ${styles.detailCard}`}>
        <form onSubmit={handleUpdate} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Platform</label>
            <input
              type="text"
              name="platform"
              className="input-field"
              value={formData.platform}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>URL</label>
            <input
              type="url"
              name="platformUrl"
              className="input-field"
              value={formData.platformUrl}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Username / Email</label>
            <input
              type="text"
              name="username"
              className="input-field"
              value={formData.username}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword || isEditing ? 'text' : 'password'}
                name="password"
                className="input-field"
                value={isEditing ? formData.password : (showPassword ? credential.password : '••••••••••••')}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
              {!isEditing && (
                <button 
                  type="button" 
                  className={`btn ${styles.toggleBtn}`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
          </div>

          {isEditing && (
            <div className={styles.actions}>
              <button type="button" className="btn" onClick={() => setIsEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
