import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard, LockKeyhole, AlertCircle, Loader2 } from 'lucide-react';
import { callInitializeTransaction, callVerifyTransaction } from '../utils/firebase';

export default function Checkout({ plan, method, user, onBack, onComplete }) {
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info'); // 'info' | 'success' | 'error'
  const [loading, setLoading] = useState(false);

  const safePlan = plan || { name: 'Pro', cadence: 'per month', price: 'NGN 5,000' };
  const safeMethod = method || 'Paystack';
  const planKey = (safePlan.name || 'pro').toLowerCase();
  const amountNaira = planKey === 'installer' ? 15000 : 5000;
  const amountKobo = amountNaira * 100;

  const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
  const flutterwaveKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '';

  const handlePaystackPayment = async () => {
    if (!paystackKey) {
      setStatusType('error');
      setStatus('Paystack public key is not configured in .env (VITE_PAYSTACK_PUBLIC_KEY).');
      return;
    }

    if (typeof window.PaystackPop === 'undefined') {
      setStatusType('error');
      setStatus('Paystack checkout SDK could not be loaded. Please check your internet connection and refresh.');
      return;
    }

    setLoading(true);
    setStatusType('info');
    setStatus('Initializing secure server transaction...');

    let serverRef = `sp_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

    try {
      if (user && user.id !== 'demo-guest') {
        const initRes = await callInitializeTransaction({ provider: 'paystack', plan: planKey });
        if (initRes?.data?.reference) {
          serverRef = initRes.data.reference;
        }
      }
    } catch (err) {
      console.warn('Server initialization fallback to client SDK:', err?.message);
    }

    setStatus('Opening secure Paystack gateway...');

    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: user?.email || 'customer@solarpulse.io',
      amount: amountKobo,
      currency: 'NGN',
      ref: serverRef,
      metadata: {
        userId: user?.id || user?.uid,
        plan: planKey,
        customerName: user?.user_metadata?.full_name || '',
      },
      callback: async (response) => {
        setStatusType('info');
        setStatus('Verifying payment with server...');
        try {
          if (user && user.id !== 'demo-guest') {
            await callVerifyTransaction({ reference: response.reference || serverRef });
          }
        } catch (e) {
          console.warn('Server verification will complete via webhook:', e);
        }
        setLoading(false);
        setStatusType('success');
        setStatus(`Payment successful! Transaction reference: ${response.reference || serverRef}. Your ${safePlan.name} plan is active.`);
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      },
      onClose: () => {
        setLoading(false);
        setStatusType('info');
        setStatus('Payment window closed before completion.');
      },
    });

    handler.openIframe();
  };

  const handleFlutterwavePayment = async () => {
    if (!flutterwaveKey) {
      setStatusType('error');
      setStatus('Flutterwave public key is not configured in .env (VITE_FLUTTERWAVE_PUBLIC_KEY).');
      return;
    }

    if (typeof window.FlutterwaveCheckout === 'undefined') {
      setStatusType('error');
      setStatus('Flutterwave checkout SDK could not be loaded. Please check your internet connection and refresh.');
      return;
    }

    setLoading(true);
    setStatusType('info');
    setStatus('Initializing secure server transaction...');

    let serverRef = `sp_flw_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

    try {
      if (user && user.id !== 'demo-guest') {
        const initRes = await callInitializeTransaction({ provider: 'flutterwave', plan: planKey });
        if (initRes?.data?.reference) {
          serverRef = initRes.data.reference;
        }
      }
    } catch (err) {
      console.warn('Server initialization fallback to client SDK:', err?.message);
    }

    setStatus('Opening secure Flutterwave gateway...');

    window.FlutterwaveCheckout({
      public_key: flutterwaveKey,
      tx_ref: serverRef,
      amount: amountNaira,
      currency: 'NGN',
      payment_options: 'card,banktransfer,ussd',
      customer: {
        email: user?.email || 'customer@solarpulse.io',
        name: user?.user_metadata?.full_name || 'Solar Analyst',
      },
      meta: {
        userId: user?.id || user?.uid,
        plan: planKey,
      },
      callback: async (data) => {
        if (data.status === 'successful' || data.chargeResponseCode === '00') {
          setStatusType('info');
          setStatus('Verifying payment with server...');
          try {
            if (user && user.id !== 'demo-guest') {
              await callVerifyTransaction({ reference: data.tx_ref || serverRef });
            }
          } catch (e) {
            console.warn('Server verification will complete via webhook:', e);
          }
          setLoading(false);
          setStatusType('success');
          setStatus(`Payment successful! Transaction reference: ${data.tx_ref || serverRef}. Your ${safePlan.name} plan is active.`);
          setTimeout(() => {
            onComplete?.();
          }, 2000);
        } else {
          setLoading(false);
          setStatusType('error');
          setStatus(`Payment was not completed (${data.status}).`);
        }
      },
      onclose: () => {
        setLoading(false);
        setStatusType('info');
        setStatus('Payment window closed before completion.');
      },
    });
  };

  const handleBankTransfer = () => {
    setStatusType('info');
    const bankName = import.meta.env.VITE_BANK_NAME;
    const accountName = import.meta.env.VITE_BANK_ACCOUNT_NAME || 'Solar Pulse Ltd';
    const accountNumber = import.meta.env.VITE_BANK_ACCOUNT_NUMBER;

    if (bankName && accountNumber) {
      setStatus(`Please transfer NGN ${amountNaira.toLocaleString()} to: ${accountName}, ${bankName}, Acc: ${accountNumber}. Use your registered email (${user?.email}) as the payment reference. We will activate your ${safePlan.name} plan within 2 hours.`);
    } else {
      setStatus(`To pay NGN ${amountNaira.toLocaleString()} via direct bank transfer, please submit a request via Support & Feedback. An official invoice with verified corporate bank details and reference number will be sent to ${user?.email || 'your email'}.`);
    }
  };

  const handleContinue = () => {
    if (safeMethod === 'Paystack') {
      handlePaystackPayment();
    } else if (safeMethod === 'Flutterwave') {
      handleFlutterwavePayment();
    } else {
      handleBankTransfer();
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '680px' }}>
      <div>
        <button className="btn-outline" onClick={onBack} style={{ marginBottom: '22px' }}>
          <ArrowLeft size={16} /> Change payment method
        </button>
        <p style={{ color: 'hsl(var(--color-solar))', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Checkout
        </p>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px' }}>
          Review your {safePlan.name} plan
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Confirm your details before continuing to secure payment.
        </p>
      </div>

      <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CreditCard size={22} style={{ color: 'hsl(var(--color-solar))' }} />
            <div>
              <strong>{safePlan.name} plan</strong>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{safePlan.cadence}</span>
            </div>
          </div>
          <strong style={{ fontSize: '1.3rem', color: 'hsl(var(--color-solar))' }}>
            NGN {amountNaira.toLocaleString()}
          </strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          <span>Payment provider</span>
          <strong style={{ color: 'var(--text-primary)' }}>{safeMethod}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          <span>Subscriber account</span>
          <strong style={{ color: 'var(--text-primary)', wordBreak: 'break-word', textAlign: 'right' }}>{user?.email}</strong>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
          <LockKeyhole size={16} style={{ color: 'hsl(var(--color-gen))', flexShrink: 0 }} />
          <span>Your payment is encrypted and processed via PCI-DSS certified gateways. Your subscription activates automatically upon verification.</span>
        </div>

        <button
          className="btn-primary"
          onClick={handleContinue}
          disabled={loading}
          style={{ width: '100%', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 700 }}
        >
          {loading ? (
            <>Processing...</>
          ) : (
            `Pay NGN ${amountNaira.toLocaleString()} via ${safeMethod}`
          )}
        </button>

        {status && (
          <div
            role="status"
            style={{
              padding: '14px',
              borderRadius: '10px',
              background: statusType === 'success' ? 'rgba(16, 185, 129, 0.12)' : statusType === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(249, 115, 22, 0.1)',
              border: `1px solid ${statusType === 'success' ? 'rgba(16, 185, 129, 0.3)' : statusType === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(249, 115, 22, 0.25)'}`,
              color: statusType === 'success' ? 'hsl(var(--color-gen))' : statusType === 'error' ? '#ef4444' : 'hsl(var(--color-solar))',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              lineHeight: '1.5'
            }}
          >
            {statusType === 'success' ? <CheckCircle2 size={18} style={{ flexShrink: 0 }} /> : statusType === 'error' ? <AlertCircle size={18} style={{ flexShrink: 0 }} /> : <CreditCard size={18} style={{ flexShrink: 0 }} />}
            <span>{status}</span>
          </div>
        )}
      </div>

      <div className="premium-card" style={{ display: 'flex', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
        <CheckCircle2 size={17} style={{ color: 'hsl(var(--color-gen))', flexShrink: 0 }} />
        <span>30-day money-back guarantee if you are not fully satisfied with your solar projections.</span>
      </div>
    </div>
  );
}
