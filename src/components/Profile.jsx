import React, { useState, useEffect, useRef } from 'react';
import { Mail, User, Clock3, Hash, Edit3, Check, X, Camera, Trash2, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { supabase } from '../utils/supabase';

export default function Profile({ user, setUser }) {
  const initialName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Solar Analyst';
  const email = user?.email || 'Unknown email';
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';
  const userId = user?.id || 'Not available';

  const [profileName, setProfileName] = useState(initialName);
  const [nameInput, setNameInput] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Change password states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fileInputRef = useRef(null);
  const avatarUrl = user?.user_metadata?.avatar_url;

  const getStatusTone = (message) => {
    if (!message) return 'info';
    const lowered = message.toLowerCase();
    if (lowered.includes('success') || lowered.includes('updated') || lowered.includes('removed') || lowered.includes('created')) {
      return 'success';
    }
    if (lowered.includes('error') || lowered.includes('do not match') || lowered.includes('must') || lowered.includes('cannot') || lowered.includes('invalid')) {
      return 'error';
    }
    return 'info';
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage('File size must be less than 5MB.');
      return;
    }

    setLoading(true);
    setStatusMessage('');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 150;
          const MAX_HEIGHT = 150;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

          const { data, error } = await supabase.auth.updateUser({
            data: { avatar_url: compressedBase64 }
          });

          setLoading(false);

          if (error) {
            setStatusMessage(error.message);
            return;
          }

          setStatusMessage('Profile picture updated successfully.');
          if (data?.user) {
            setUser?.(data.user);
          }
        };
        img.onerror = () => {
          setLoading(false);
          setStatusMessage('Invalid image file.');
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        setLoading(false);
        setStatusMessage('Error reading file.');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setLoading(false);
      setStatusMessage('Error processing image: ' + err.message);
    }
  };

  const handleRemoveAvatar = async () => {
    setLoading(true);
    setStatusMessage('');

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { avatar_url: null }
      });

      setLoading(false);

      if (error) {
        setStatusMessage(error.message);
        return;
      }

      setStatusMessage('Profile picture removed.');
      if (data?.user) {
        setUser?.(data.user);
      }
    } catch (err) {
      setLoading(false);
      setStatusMessage('Error removing image: ' + err.message);
    }
  };


  useEffect(() => {
    setProfileName(initialName);
    setNameInput(initialName);
  }, [initialName]);

  const handleChangePassword = async () => {
    setPasswordStatus('');
    if (!newPassword || newPassword.length < 8) {
      setPasswordStatus('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordStatus('Passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      setPasswordStatus(error.message);
    } else {
      setPasswordStatus('Password updated successfully!');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordForm(false);
    }
  };

  const handleEditToggle = () => {
    setStatusMessage('');
    setNameInput(profileName);
    setIsEditing((prev) => !prev);
  };

  const handleSave = async () => {
    if (!nameInput.trim()) {
      setStatusMessage('Name cannot be empty.');
      return;
    }

    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session) {
      setLoading(false);
      setStatusMessage('No active auth session. Please sign out and sign in again.');
      return;
    }

    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: nameInput.trim() },
    });

    setLoading(false);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setProfileName(nameInput.trim());
    setStatusMessage('Profile updated successfully.');
    setIsEditing(false);

    if (data?.user) {
      const updatedName = data.user.user_metadata?.full_name;
      if (updatedName) {
        setProfileName(updatedName);
        setUser?.(data.user);
      }
    }
  };

  return (
    <section className="profile-card premium-card">
      <div className="profile-hero">
        <div className="profile-avatar-container">
          <div 
            className="profile-avatar" 
            onClick={handleAvatarClick} 
            title="Click to change profile picture"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="profile-avatar-image" />
            ) : (
              profileName.charAt(0).toUpperCase()
            )}
            <div className="profile-avatar-overlay">
              <Camera size={18} />
              <span>Change</span>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
            disabled={loading}
          />
          {avatarUrl && (
            <button
              type="button"
              className="profile-avatar-remove-btn"
              onClick={handleRemoveAvatar}
              disabled={loading}
              title="Remove profile picture"
            >
              <Trash2 size={12} /> Remove
            </button>
          )}
        </div>
        <div>
          <p className="profile-greeting">Welcome back,</p>
          {isEditing ? (
            <input
              className="profile-name-input"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              disabled={loading}
            />
          ) : (
            <h2>{profileName}</h2>
          )}
          <p className="profile-subtitle">Your personalized Solar Pulse profile.</p>
        </div>
        <div className="profile-actions">
          {isEditing ? (
            <>
              <button
                type="button"
                className="profile-button profile-save-btn"
                onClick={handleSave}
                disabled={loading}
              >
                <Check size={16} /> Save
              </button>
              <button
                type="button"
                className="profile-button profile-cancel-btn"
                onClick={handleEditToggle}
                disabled={loading}
              >
                <X size={16} /> Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="profile-button profile-edit-btn"
              onClick={handleEditToggle}
            >
              <Edit3 size={16} /> Edit profile
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className={`status-banner status-banner-${getStatusTone(statusMessage)}`} role="status" aria-live="polite">
          {getStatusTone(statusMessage) === 'success' ? (
            <CheckCircle2 size={18} />
          ) : getStatusTone(statusMessage) === 'error' ? (
            <AlertCircle size={18} />
          ) : (
            <Info size={18} />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="profile-details">
        <div className="profile-row">
          <User size={18} />
          <div>
            <span>Name</span>
            <p>{profileName}</p>
          </div>
        </div>

        <div className="profile-row">
          <Mail size={18} />
          <div>
            <span>Email</span>
            <p>{email}</p>
          </div>
        </div>

        <div className="profile-row">
          <Clock3 size={18} />
          <div>
            <span>Member since</span>
            <p>{createdAt}</p>
          </div>
        </div>

        <div className="profile-row">
          <Hash size={18} />
          <div>
            <span>User ID</span>
            <p>{userId}</p>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <button
          type="button"
          className="btn-outline"
          onClick={() => { setShowPasswordForm(prev => !prev); setPasswordStatus(''); }}
          style={{ fontSize: '0.875rem', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}
          aria-label="Toggle change password form"
        >
          <KeyRound size={16} />
          {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
        </button>

        {showPasswordForm && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '400px' }}>
            {/* New Password */}
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPw ? 'text' : 'password'}
                placeholder="New password (min 8 chars)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="profile-name-input"
                style={{ fontSize: '1rem', fontWeight: 500, width: '100%', maxWidth: '100%', paddingRight: '44px' }}
                disabled={passwordLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(p => !p)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                aria-label={showNewPw ? 'Hide password' : 'Show password'}
              >
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Confirm Password */}
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              className="profile-name-input"
              style={{ fontSize: '1rem', fontWeight: 500, width: '100%', maxWidth: '100%' }}
              disabled={passwordLoading}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={handleChangePassword}
              disabled={passwordLoading || !newPassword || !confirmNewPassword}
              style={{ width: 'fit-content', fontSize: '0.875rem', padding: '10px 20px' }}
            >
              <KeyRound size={15} />
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
            {passwordStatus && (
              <div className={`status-banner status-banner-${getStatusTone(passwordStatus)}`} style={{ marginTop: '8px' }} role="status" aria-live="polite">
                {getStatusTone(passwordStatus) === 'success' ? (
                  <CheckCircle2 size={18} />
                ) : getStatusTone(passwordStatus) === 'error' ? (
                  <AlertCircle size={18} />
                ) : (
                  <Info size={18} />
                )}
                <span>{passwordStatus}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
