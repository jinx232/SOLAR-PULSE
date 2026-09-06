import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard, LockKeyhole } from 'lucide-react';

export default function Checkout({ plan, method, user, onBack, onComplete }) {
  const [status, setStatus] = useState('');

  const handleContinue = () => {
    setStatus('Checkout is not connected yet. Add your provider keys and secure webhook before accepting payments.');
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '680px' }}>
      <div>
        <button className="btn-outline" onClick={onBack} style={{ marginBottom: '22px' }}><ArrowLeft size={16} /> Change payment method</button>
        <p style={{ color: 'hsl(var(--color-solar))', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Checkout</p>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px' }}>Review your {plan.name} plan</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Confirm your details before continuing to secure payment.</p>
      </div>

      <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CreditCard size={22} style={{ color: 'hsl(var(--color-solar))' }} />
            <div><strong>{plan.name} plan</strong><span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{plan.cadence}</span></div>
          </div>
          <strong style={{ fontSize: '1.2rem' }}>{plan.price}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.88rem' }}><span>Payment method</span><strong style={{ color: 'var(--text-primary)' }}>{method}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.88rem' }}><span>Account</span><strong style={{ color: 'var(--text-primary)', wordBreak: 'break-word', textAlign: 'right' }}>{user?.email}</strong></div>
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}><LockKeyhole size={16} style={{ color: 'hsl(var(--color-gen))', flexShrink: 0 }} /> Your subscription activates only after the payment provider confirms payment securely.</div>
        <button className="btn-primary" onClick={handleContinue} style={{ width: '100%' }}>Continue to secure payment</button>
        {status && <div role="status" style={{ padding: '12px', borderRadius: '10px', background: 'rgba(249, 115, 22, 0.1)', color: 'hsl(var(--color-solar))', fontSize: '0.85rem' }}>{status}</div>}
      </div>

      <div className="premium-card" style={{ display: 'flex', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}><CheckCircle2 size={17} style={{ color: 'hsl(var(--color-gen))', flexShrink: 0 }} /> No charge has been made. Payment processing will be enabled after the Firebase billing and webhook setup is complete.</div>
    </div>
  );
}
