import React from 'react';
import { ArrowRight, CreditCard, Landmark, Smartphone } from 'lucide-react';

export default function PaymentMethods({ plan, onBack, onContinue }) {
  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '760px' }}>
      <div>
        <button className="btn-outline" onClick={onBack} style={{ marginBottom: '22px' }}>Back to plans</button>
        <p style={{ color: 'hsl(var(--color-solar))', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Payment methods</p>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px' }}>How would you like to pay?</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Choose a payment route for the {plan.name} plan. You will review the order before any payment begins.</p>
      </div>

      <div className="grid-cols-3">
        <button className="premium-card" onClick={() => onContinue('Paystack')} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <CreditCard size={24} style={{ color: 'hsl(var(--color-solar))' }} />
          <strong>Paystack</strong>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Cards, bank transfer, and USSD.</span>
          <span style={{ color: 'hsl(var(--color-solar))', fontSize: '0.8rem', fontWeight: 700 }}>Continue <ArrowRight size={14} /></span>
        </button>
        <button className="premium-card" onClick={() => onContinue('Flutterwave')} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <Smartphone size={24} style={{ color: 'hsl(var(--color-bat))' }} />
          <strong>Flutterwave</strong>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Cards, bank transfer, mobile money, and USSD.</span>
          <span style={{ color: 'hsl(var(--color-bat))', fontSize: '0.8rem', fontWeight: 700 }}>Continue <ArrowRight size={14} /></span>
        </button>
        <button className="premium-card" onClick={() => onContinue('Bank transfer')} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <Landmark size={24} style={{ color: 'hsl(var(--color-gen))' }} />
          <strong>Bank transfer</strong>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Request an invoice and transfer instructions.</span>
          <span style={{ color: 'hsl(var(--color-gen))', fontSize: '0.8rem', fontWeight: 700 }}>Continue <ArrowRight size={14} /></span>
        </button>
      </div>
    </div>
  );
}
