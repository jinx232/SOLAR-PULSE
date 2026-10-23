import React, { useState } from 'react';
import { Sun, Leaf, Zap, Battery, ShieldCheck, ArrowRight, Download, Sparkles } from 'lucide-react';
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from '../utils/firebase';

export default function Auth({ authView, setAuthView, onAuthenticate, onGuestLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage('');

    if (authView === 'signup' && password !== confirmPassword) {
      setStatusMessage('Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);

    try {
      if (authView === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
        setStatusMessage('Signed in successfully. Redirecting...');
        onAuthenticate();
      } else {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name.trim() });
        setStatusMessage('Account created and signed in successfully. Redirecting...');
        onAuthenticate();
      }

      setLoading(false);
    } catch (error) {
      setStatusMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Ambient Animated Aurora Mesh & Floating Solar Embers */}
      <div className="auth-aurora a1" aria-hidden="true" />
      <div className="auth-aurora a2" aria-hidden="true" />
      <div className="auth-aurora a3" aria-hidden="true" />
      <div className="auth-embers" aria-hidden="true">
        <span style={{ '--x': '12%', '--d': '12s', '--s': '-2s', '--sz': '3px' }} />
        <span style={{ '--x': '28%', '--d': '15s', '--s': '-6s', '--sz': '4px' }} />
        <span style={{ '--x': '44%', '--d': '10s', '--s': '-3s', '--sz': '3px' }} />
        <span style={{ '--x': '62%', '--d': '14s', '--s': '-9s', '--sz': '5px' }} />
        <span style={{ '--x': '78%', '--d': '11s', '--s': '-4s', '--sz': '3px' }} />
        <span style={{ '--x': '90%', '--d': '16s', '--s': '-7s', '--sz': '4px' }} />
      </div>

      {/* Top Banner to the New Interactive 3D Showcase & Download Page */}
      <aside className="auth-top-banner">
        <div className="auth-top-banner-inner">
          <span className="auth-banner-badge"><Sparkles size={13} /> NEW SHOWCASE</span>
          <span className="auth-banner-text">Experience the interactive 3D solar telemetry &amp; download hub:</span>
          <a href="/landing/index.html" className="auth-banner-link">
            Open Download &amp; Showcase Page <ArrowRight size={14} />
          </a>
        </div>
      </aside>

      <div className="auth-layout-container">
        {/* Left Side: Photorealistic Solar Installation Showcase */}
        <div className="auth-visual-showcase">
          <div className="auth-visual-frame">
            <img
              src="/landing/img/usecase-residential.jpg"
              alt="Modern solar-powered residence with rooftop PV panels at golden hour"
              className="auth-visual-img"
              loading="eager"
            />
            <div className="auth-visual-gradient" />
            
            {/* Live Glass Telemetry Overlay Chips */}
            <div className="auth-visual-chips">
              <div className="auth-glass-chip chip-yield">
                <Zap size={15} style={{ color: '#f59e0b' }} />
                <div>
                  <div className="chip-label">Active Solar Yield</div>
                  <div className="chip-val">6.5 kW Monitored</div>
                </div>
              </div>

              <div className="auth-glass-chip chip-storage">
                <Battery size={15} style={{ color: '#10b981' }} />
                <div>
                  <div className="chip-label">Storage Readiness</div>
                  <div className="chip-val">13.5 kWh Lithium</div>
                </div>
              </div>

              <div className="auth-glass-chip chip-region">
                <Leaf size={15} style={{ color: '#06b6d4' }} />
                <div>
                  <div className="chip-label">Irradiance Region</div>
                  <div className="chip-val">West Africa Baseline</div>
                </div>
              </div>
            </div>

            <div className="auth-visual-caption">
              <div className="auth-caption-pill">Enterprise Solar Intelligence</div>
              <h3>Empowering Clean Energy Sizing &amp; 25-Year Lifecycle ROI</h3>
              <p>Trusted by residential homeowners, commercial developers, and solar field engineers.</p>
            </div>
          </div>
        </div>

        {/* Right Side: High-End Authentication Card */}
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-brand-row">
              <div className="auth-brand-icon">
                <Sun size={26} style={{ color: '#f97316' }} />
              </div>
              <span className="auth-brand-name">Solar Pulse</span>
            </div>
            <span className="auth-eyebrow">Secure Engineering Station</span>
            <h1>{authView === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
            <p>
              Sign in to access real-time energy telemetry, battery curves, and accurate equipment sizing models.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {authView === 'signup' && (
              <label className="auth-field">
                <span>Full name</span>
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
                placeholder="analyst@solarpulse.io"
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

            <button className="auth-submit-btn" type="submit" disabled={loading} aria-busy={loading}>
              {loading ? 'Authenticating...' : authView === 'signin' ? 'Sign In to Station →' : 'Create Account →'}
            </button>

            {statusMessage && (
              <p className="auth-status-message" role="alert" aria-live="polite">{statusMessage}</p>
            )}
          </form>

          <div className="auth-footer">
            <p>
              {authView === 'signin'
                ? "Don't have an account yet?"
                : 'Already registered?'}
              <button
                type="button"
                className="auth-toggle-btn"
                onClick={() => setAuthView(authView === 'signin' ? 'signup' : 'signin')}
              >
                {authView === 'signin' ? 'Create an account' : 'Sign in'}
              </button>
            </p>

            {onGuestLogin && (
              <div className="auth-guest-wrap">
                <button
                  type="button"
                  className="auth-guest-btn"
                  onClick={onGuestLogin}
                >
                  <Zap size={16} style={{ color: '#f97316' }} />
                  <span>Instant Demo Access (Skip Login)</span>
                </button>
              </div>
            )}

            <div className="auth-external-links">
              <a href="/landing/index.html" className="auth-sub-link">
                <Download size={13} /> Download Mobile &amp; Desktop App
              </a>
              <span className="auth-dot-sep">·</span>
              <span className="auth-sub-text">
                <ShieldCheck size={13} style={{ color: '#10b981' }} /> 256-Bit SSL Encrypted
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
