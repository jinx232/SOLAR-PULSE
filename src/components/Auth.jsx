import React, { useState } from 'react';
import { Sun, Leaf, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { supabase } from '../utils/supabase';

export default function Auth({ authView, setAuthView, onAuthenticate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const getStatusTone = (message) => {
    if (!message) return 'info';
    const lowered = message.toLowerCase();
    if (lowered.includes('success') || lowered.includes('signed in') || lowered.includes('created')) {
      return 'success';
    }
    if (lowered.includes('error') || lowered.includes('do not match') || lowered.includes('must') || lowered.includes('cannot') || lowered.includes('invalid')) {
      return 'error';
    }
    return 'info';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage('');

    if (authView === 'signup' && password !== confirmPassword) {
      setStatusMessage('Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);

    if (authView === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setStatusMessage(error.message);
      } else {
        setStatusMessage('Signed in successfully. Redirecting...');
        onAuthenticate();
      }
    } else {
      const { data, error } = await supabase.auth.signUp(
        {
          email,
          password,
        },
        {
          data: { full_name: name },
        }
      );

      if (error) {
        setStatusMessage(error.message);
      } else if (data?.session) {
        setStatusMessage('Account created and signed in successfully. Redirecting...');
        onAuthenticate();
      } else {
        setStatusMessage('Account created. Please confirm your email before signing in.');
        setAuthView('signin');
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-artboard">
        <div className="auth-accent-ring" />
        <div className="auth-icon-wrap">
          <Sun size={42} className="auth-icon" />
          <Leaf size={18} className="auth-icon-badge" />
        </div>
        <div className="auth-artboard-glow" />
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-eyebrow">Solar Pulse Secure Access</span>
          <h1>{authView === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
          <p>
            Sign in to access energy insights, ROI modeling, and premium solar
            planning tools designed for technical teams.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {authView === 'signup' && (
            <label className="auth-field">
              <span>Name</span>
              <input
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email address</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={authView === 'signin' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          {authView === 'signup' && (
            <label className="auth-field">
              <span>Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
              />
            </label>
          )}

          <button className="auth-submit-btn" type="submit" disabled={loading}>
            {loading ? 'Processing...' : authView === 'signin' ? 'Sign in' : 'Create account'}
          </button>

          {statusMessage && (
            <div
              className={`status-banner status-banner-${getStatusTone(statusMessage)}`}
              role="status"
              aria-live="polite"
            >
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
        </form>

        <div className="auth-footer">
          <p>
            {authView === 'signin'
              ? "Don't have an account?"
              : 'Already have an account?'}
            <button
              type="button"
              className="auth-toggle-btn"
              onClick={() => setAuthView(authView === 'signin' ? 'signup' : 'signin')}
            >
              {authView === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
