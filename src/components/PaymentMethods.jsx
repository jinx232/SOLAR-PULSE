import React from 'react';
import { ArrowRight, CreditCard, Landmark, Smartphone } from 'lucide-react';

export default function PaymentMethods({ plan, onBack, onContinue }) {
  const safePlan = plan || { name: 'Pro', price: 'NGN 5,000', cadence: 'per month' };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '760px' }}>
      <div>
        <button className="btn-outline" onClick={onBack} aria-label="Back to plans view" style={{ marginBottom: '22px' }}>
          Back to plans
        </button>
        <p style={{ color: 'hsl(var(--color-solar))', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Payment methods</p>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px' }}>How would you like to pay?</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Choose a payment route for the {safePlan.name} plan. You will review the order before any payment begins.</p>
      </div>

      <div className="grid-cols-3" role="group" aria-label="Available payment methods">
        <button
          className="premium-card"
          onClick={() => onContinue('Paystack')}
          aria-label="Select Paystack payment method: cards, bank transfer, and USSD"
          style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <CreditCard size={24} style={{ color: 'hsl(var(--color-solar))' }} aria-hidden="true" />
          <strong>Paystack</strong>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Cards, bank transfer, and USSD.</span>
          <span style={{ color: 'hsl(var(--color-solar))', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            Continue <ArrowRight size={14} aria-hidden="true" />
          </span>
        </button>
        <button
          className="premium-card"
          onClick={() => onContinue('Flutterwave')}
          aria-label="Select Flutterwave payment method: cards, bank transfer, mobile money, and USSD"
          style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <Smartphone size={24} style={{ color: 'hsl(var(--color-bat))' }} aria-hidden="true" />
          <strong>Flutterwave</strong>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Cards, bank transfer, mobile money, and USSD.</span>
          <span style={{ color: 'hsl(var(--color-bat))', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            Continue <ArrowRight size={14} aria-hidden="true" />
          </span>
        </button>
        <button
          className="premium-card"
          onClick={() => onContinue('Bank transfer')}
          aria-label="Select direct bank transfer: request an invoice and transfer instructions"
          style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <Landmark size={24} style={{ color: 'hsl(var(--color-gen))' }} aria-hidden="true" />
          <strong>Bank transfer</strong>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Request an invoice and transfer instructions.</span>
          <span style={{ color: 'hsl(var(--color-gen))', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            Continue <ArrowRight size={14} aria-hidden="true" />
          </span>
        </button>
      </div>
    </div>
  );
}
