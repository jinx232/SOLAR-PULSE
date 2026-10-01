import React, { useState, useEffect, useRef } from 'react';
import {
  X, Send, AlertTriangle, CheckCircle2, MessageSquare,
  Zap, Bug, CreditCard, UserCircle, Lightbulb, Flag
} from 'lucide-react';

const CATEGORIES = [
  { value: 'bug',         label: 'Bug Report',        icon: '🐛' },
  { value: 'feature',     label: 'Feature Request',   icon: '💡' },
  { value: 'billing',     label: 'Billing Issue',     icon: '💳' },
  { value: 'account',     label: 'Account Problem',   icon: '👤' },
  { value: 'performance', label: 'Performance Issue', icon: '⚡' },
  { value: 'complaint',   label: 'Complaint',         icon: '⚠️' },
  { value: 'general',     label: 'General Feedback',  icon: '💬' },
];

const PLATFORMS = [
  { value: 'web',     label: '🌐 Web Browser' },
  { value: 'ios',     label: '🍎 iOS (iPhone/iPad)' },
  { value: 'android', label: '🤖 Android' },
  { value: 'desktop', label: '🖥️ Desktop' },
];

const MAX_CHARS = 1500;

export default function ComplaintModal({ isOpen, onClose, user }) {
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
    email: user?.email || '',
    category: '',
    priority: 'normal',
    platform: 'web',
    subject: '',
    message: '',
  });

  const firstFocusRef = useRef(null);

  // Reset form when closed/opened
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setErrors({});
      setLoading(false);
      setForm(prev => ({
        ...prev,
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        category: '',
        priority: 'normal',
        platform: 'web',
        subject: '',
        message: '',
      }));
      setTimeout(() => firstFocusRef.current?.focus(), 100);
    }
  }, [isOpen, user]);

  // Trap focus inside modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required.';
    if (!form.category) errs.category = 'Please select a category.';
    if (!form.subject.trim()) errs.subject = 'Subject is required.';
    if (!form.message.trim() || form.message.trim().length < 20) errs.message = 'Message must be at least 20 characters.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    // Simulate API submission — replace with real endpoint when ready
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setStep('success');
  };

  if (!isOpen) return null;

  const charsLeft = MAX_CHARS - form.message.length;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complaint-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ zIndex: 500, alignItems: 'flex-end' }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px 20px 0 0',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideInUp 0.3s ease forwards',
          display: 'flex',
          flexDirection: 'column',
          margin: '0 auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border-color)',
          position: 'sticky', top: 0,
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '20px 20px 0 0',
          zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, hsl(var(--color-solar)), #ef4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <MessageSquare size={18} color="#000" />
            </div>
            <div>
              <h2 id="complaint-modal-title" style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                Support &amp; Feedback
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                We respond within 24 hours
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 8, display: 'flex' }}
            aria-label="Close support form"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 28px', flex: 1 }}>

          {step === 'success' ? (
            /* ── SUCCESS STATE ── */
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <CheckCircle2 size={32} color="hsl(var(--color-gen))" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>Report Submitted!</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
                Thank you for reaching out. Our support team will review your report and
                respond to <strong style={{ color: 'var(--text-primary)' }}>{form.email}</strong> within 24 hours.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn-outline" onClick={() => setStep('form')} style={{ fontSize: '0.875rem' }}>
                  Submit Another
                </button>
                <button className="btn-primary" onClick={onClose} style={{ fontSize: '0.875rem' }}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* ── FORM STATE ── */
            <form onSubmit={handleSubmit} noValidate>
              {/* Name + Email row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="cm-name">Full Name *</label>
                  <input
                    id="cm-name" ref={firstFocusRef}
                    type="text" className="form-input"
                    value={form.name} onChange={set('name')}
                    placeholder="Your name"
                    style={{ borderColor: errors.name ? '#ef4444' : undefined }}
                  />
                  {errors.name && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{errors.name}</span>}
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="cm-email">Email *</label>
                  <input
                    id="cm-email" type="email" className="form-input"
                    value={form.email} onChange={set('email')}
                    placeholder="you@email.com"
                    style={{ borderColor: errors.email ? '#ef4444' : undefined }}
                  />
                  {errors.email && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{errors.email}</span>}
                </div>
              </div>

              {/* Category chips */}
              <div className="form-group">
                <label className="form-label">Category *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value} type="button"
                      onClick={() => { setForm(p => ({ ...p, category: cat.value })); setErrors(p => ({ ...p, category: '' })); }}
                      style={{
                        padding: '6px 12px', borderRadius: 99,
                        fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${form.category === cat.value ? 'hsl(var(--color-solar))' : 'var(--border-color)'}`,
                        background: form.category === cat.value ? 'var(--color-solar-glow)' : 'var(--bg-primary)',
                        color: form.category === cat.value ? 'hsl(var(--color-solar))' : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
                {errors.category && <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, display: 'block' }}>{errors.category}</span>}
              </div>

              {/* Priority + Platform row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="cm-priority">Priority</label>
                  <select id="cm-priority" className="form-input" value={form.priority} onChange={set('priority')}>
                    <option value="low">🟢 Low</option>
                    <option value="normal">🟡 Normal</option>
                    <option value="high">🔴 High — Urgent</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="cm-platform">Platform</label>
                  <select id="cm-platform" className="form-input" value={form.platform} onChange={set('platform')}>
                    {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div className="form-group">
                <label className="form-label" htmlFor="cm-subject">Subject *</label>
                <input
                  id="cm-subject" type="text" className="form-input"
                  value={form.subject} onChange={set('subject')}
                  placeholder="Brief description of your issue"
                  style={{ borderColor: errors.subject ? '#ef4444' : undefined }}
                />
                {errors.subject && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{errors.subject}</span>}
              </div>

              {/* Message */}
              <div className="form-group">
                <label className="form-label" htmlFor="cm-message">Message *</label>
                <textarea
                  id="cm-message" className="form-input"
                  value={form.message} onChange={set('message')}
                  placeholder="Describe your issue in detail. Include any error messages, the steps that led to the problem, your device and browser..."
                  maxLength={MAX_CHARS}
                  rows={5}
                  style={{
                    resize: 'vertical', minHeight: 100,
                    borderColor: errors.message ? '#ef4444' : undefined
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  {errors.message
                    ? <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{errors.message}</span>
                    : <span />
                  }
                  <span style={{ fontSize: '0.72rem', color: charsLeft < 100 ? '#ef4444' : 'var(--text-muted)' }}>
                    {form.message.length}/{MAX_CHARS}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit" className="btn-primary"
                disabled={loading}
                style={{ width: '100%', height: 48, fontSize: '0.95rem', fontWeight: 700, gap: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {loading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                    Submitting...
                  </>
                ) : (
                  <><Send size={16} /> Submit Report</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
