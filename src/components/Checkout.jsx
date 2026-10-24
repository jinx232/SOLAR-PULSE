import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard, LockKeyhole, AlertCircle, Loader2 } from 'lucide-react';
import { callInitializeTransaction, callVerifyTransaction } from '../utils/firebase';
import { PLAN_CATALOGUE, formatMoney } from '../utils/plans';
import { PaystackIcon, FlutterwaveIcon } from './ProviderIcons';

export default function Checkout({ plan, method, user, onBack, onComplete }) {
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info'); // 'info' | 'success' | 'error'
  const [loading, setLoading] = useState(false);

  const planKey = (plan?.id || plan?.name || 'pro').toLowerCase();
  const planConfig = PLAN_CATALOGUE[planKey] || PLAN_CATALOGUE.pro;
  const safePlan = {
    ...planConfig,
    name: planConfig.name,
    cadence: plan?.cadence || 'per month',
  };
  const safeMethod = method || 'Paystack';
  const amountNaira = planConfig.amount;
  const amountKobo = amountNaira * 100;

  const isGuest = !user || user.id === 'demo-guest' || !user.email;

  const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
  const flutterwaveKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '';

  const handlePaystackPayment = async () => {
    if (isGuest) {
      setStatusType('error');
      setStatus('Please sign in or register with an email account before purchasing a subscription.');
      return;
    }

    if (!paystackKey) {
      setStatusType('error');
      setStatus('Paystack public key is not configured in .env (VITE_PAYSTACK_PUBLIC_KEY).');
      return;
    }

    setLoading(true);
    setStatusType('info');
    setStatus('Initializing secure server transaction...');

    let initData = null;
    try {
      const initRes = await callInitializeTransaction({ provider: 'paystack', plan: planConfig.id });
      if (!initRes?.data?.reference) {
        throw new Error('Server did not return a valid transaction reference.');
      }
      initData = initRes.data;
    } catch (err) {
      console.error('Server transaction initialisation failed:', err);
      setLoading(false);
      setStatusType('error');
      setStatus(err?.message || 'Failed to initialize transaction with the server. Please try again.');
      return;
    }

    const { reference, accessCode, checkoutUrl } = initData;
    setStatus('Opening secure Paystack gateway...');

    // Verification polling helper
    const verifyPayment = async (refToVerify) => {
      setStatusType('info');
      setStatus('Confirming payment with server...');
      try {
        const verifyRes = await callVerifyTransaction({ reference: refToVerify });
        if (verifyRes?.data?.status === 'active') {
          setLoading(false);
          setStatusType('success');
          setStatus(`Payment verified! Transaction reference: ${refToVerify}. Your ${safePlan.name} plan is now active.`);
          setTimeout(() => onComplete?.(), 2000);
          return;
        }
        if (verifyRes?.data?.status === 'pending') {
          setLoading(false);
          setStatusType('info');
          setStatus(`Payment received by Paystack. Server webhook is finalizing activation (ref: ${refToVerify}).`);
          setTimeout(() => onComplete?.(), 3000);
          return;
        }
        setLoading(false);
        setStatusType('error');
        setStatus(`Payment verification returned status "${verifyRes?.data?.status || 'unconfirmed'}".`);
      } catch (verifyErr) {
        setLoading(false);
        console.warn('Direct verification error (webhook will fulfill):', verifyErr);
        setStatusType('info');
        setStatus(`Payment processing. We are verifying reference ${refToVerify} via background webhook.`);
      }
    };

    // Paystack v2 Inline SDK check
    try {
      if (typeof window.PaystackPop !== 'undefined') {
        // Check if v2 class constructor is available
        if (typeof window.PaystackPop === 'function') {
          const paystack = new window.PaystackPop();
          if (accessCode && typeof paystack.resumeTransaction === 'function') {
            paystack.resumeTransaction(accessCode);
            // In v2 resumeTransaction, monitor or poll verification
            setLoading(false);
            setStatusType('info');
            setStatus(`Paystack checkout modal opened. Complete your payment in the dialog.`);
            return;
          }
          if (typeof paystack.newTransaction === 'function') {
            paystack.newTransaction({
              key: paystackKey,
              email: user.email,
              amount: amountKobo,
              currency: planConfig.currency || 'NGN',
              reference,
              onSuccess: (transaction) => verifyPayment(transaction.reference || reference),
              onCancel: () => {
                setLoading(false);
                setStatusType('info');
                setStatus('Payment cancelled.');
              },
            });
            return;
          }
        }

        // Paystack v1 setup fallback
        if (window.PaystackPop.setup) {
          const handler = window.PaystackPop.setup({
            key: paystackKey,
            email: user.email,
            amount: amountKobo,
            currency: planConfig.currency || 'NGN',
            ref: reference,
            callback: (response) => verifyPayment(response.reference || reference),
            onClose: () => {
              setLoading(false);
              setStatusType('info');
              setStatus('Payment window closed before completion.');
            },
          });
          handler.openIframe();
          return;
        }
      }

      // If inline JS is blocked, redirect to checkout URL
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      throw new Error('Paystack SDK not available. Please refresh the page.');
    } catch (launchErr) {
      console.error('Error opening Paystack modal:', launchErr);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setLoading(false);
        setStatusType('error');
        setStatus('Could not open payment gateway. Please check your connection and retry.');
      }
    }
  };

  const handleFlutterwavePayment = async () => {
    if (isGuest) {
      setStatusType('error');
      setStatus('Please sign in or register with an email account before purchasing a subscription.');
      return;
    }

    if (!flutterwaveKey) {
      setStatusType('error');
      setStatus('Flutterwave public key is not configured in .env (VITE_FLUTTERWAVE_PUBLIC_KEY).');
      return;
    }

    setLoading(true);
    setStatusType('info');
    setStatus('Initializing secure server transaction...');

    let initData = null;
    try {
      const initRes = await callInitializeTransaction({ provider: 'flutterwave', plan: planConfig.id });
      if (!initRes?.data?.reference) {
        throw new Error('Server did not return a valid transaction reference.');
      }
      initData = initRes.data;
    } catch (err) {
      console.error('Flutterwave server transaction initialisation failed:', err);
      setLoading(false);
      setStatusType('error');
      setStatus(err?.message || 'Failed to initialize transaction with the server. Please try again.');
      return;
    }

    const { reference, checkoutUrl } = initData;

    const verifyPayment = async (txRef) => {
      setStatusType('info');
      setStatus('Confirming payment with server...');
      try {
        const verifyRes = await callVerifyTransaction({ reference: txRef });
        if (verifyRes?.data?.status === 'active') {
          setLoading(false);
          setStatusType('success');
          setStatus(`Payment verified! Reference: ${txRef}. Your ${safePlan.name} plan is now active.`);
          setTimeout(() => onComplete?.(), 2000);
          return;
        }
        if (verifyRes?.data?.status === 'pending') {
          setLoading(false);
          setStatusType('info');
          setStatus(`Payment received by Flutterwave. Server webhook is finalizing activation.`);
          setTimeout(() => onComplete?.(), 3000);
          return;
        }
        setLoading(false);
        setStatusType('error');
        setStatus(`Payment verification returned status "${verifyRes?.data?.status || 'unconfirmed'}".`);
      } catch (verifyErr) {
        setLoading(false);
        console.warn('Direct verification error (webhook will fulfill):', verifyErr);
        setStatusType('info');
        setStatus(`Payment processing. We are verifying reference ${txRef} via background webhook.`);
      }
    };

    if (typeof window.FlutterwaveCheckout === 'function') {
      setStatus('Opening secure Flutterwave gateway...');
      window.FlutterwaveCheckout({
        public_key: flutterwaveKey,
        tx_ref: reference,
        amount: amountNaira,
        currency: planConfig.currency || 'NGN',
        payment_options: 'card,banktransfer,ussd',
        customer: {
          email: user.email,
          name: user.user_metadata?.full_name || user.email.split('@')[0],
        },
        meta: {
          userId: user.id || user.uid,
          plan: planConfig.id,
        },
        callback: (data) => {
          if (data.status === 'successful' || data.chargeResponseCode === '00') {
            verifyPayment(data.tx_ref || reference);
          } else {
            setLoading(false);
            setStatusType('error');
            setStatus(`Payment was not completed (${data.status || 'failed'}).`);
          }
        },
        onclose: () => {
          setLoading(false);
          setStatusType('info');
          setStatus('Payment window closed before completion.');
        },
      });
    } else if (checkoutUrl) {
      window.location.href = checkoutUrl;
    } else {
      setLoading(false);
      setStatusType('error');
      setStatus('Flutterwave checkout SDK could not be loaded. Please refresh the page.');
    }
  };

  const handleBankTransfer = () => {
    setStatusType('info');
    const bankName = import.meta.env.VITE_BANK_NAME;
    const accountName = import.meta.env.VITE_BANK_ACCOUNT_NAME || 'Solar Pulse Ltd';
    const accountNumber = import.meta.env.VITE_BANK_ACCOUNT_NUMBER;

    if (bankName && accountNumber) {
      setStatus(`Please transfer ${formatMoney(amountNaira)} to: ${accountName}, ${bankName}, Acc: ${accountNumber}. Use your registered email (${user?.email || 'your email'}) as the payment reference. We will activate your ${safePlan.name} plan once payment has been confirmed by our finance team (typically within 1 business day).`);
    } else {
      setStatus(`To pay ${formatMoney(amountNaira)} via direct bank transfer, please submit a request via Support & Feedback. An official invoice with verified corporate bank details and reference number will be sent to ${user?.email || 'your email'}.`);
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
        <button
          className="btn-outline"
          onClick={onBack}
          aria-label="Back to payment methods"
          style={{ marginBottom: '22px' }}
        >
          <ArrowLeft size={16} aria-hidden="true" /> Change payment method
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
            <CreditCard size={22} style={{ color: 'hsl(var(--color-solar))' }} aria-hidden="true" />
            <div>
              <strong>{safePlan.name} plan</strong>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{safePlan.cadence}</span>
            </div>
          </div>
          <strong style={{ fontSize: '1.3rem', color: 'hsl(var(--color-solar))' }}>
            {formatMoney(amountNaira)}
          </strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          <span>Payment provider</span>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', padding: '5px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {safeMethod.toLowerCase().includes('paystack') && <PaystackIcon size={18} />}
            {safeMethod.toLowerCase().includes('flutterwave') && <FlutterwaveIcon size={18} />}
            <strong style={{ color: 'var(--text-primary)' }}>{safeMethod}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          <span>Subscriber account</span>
          <strong style={{ color: 'var(--text-primary)', wordBreak: 'break-word', textAlign: 'right' }}>
            {user?.email || (isGuest ? 'Guest (Sign in required)' : 'No email attached')}
          </strong>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
          <LockKeyhole size={16} style={{ color: 'hsl(var(--color-gen))', flexShrink: 0 }} aria-hidden="true" />
          <span>Your payment is encrypted and processed via PCI-DSS certified gateways. Your subscription activates automatically upon server verification.</span>
        </div>

        <button
          className="btn-primary"
          onClick={handleContinue}
          disabled={loading}
          aria-busy={loading}
          style={{ width: '100%', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 700 }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              {safeMethod.toLowerCase().includes('paystack') && <PaystackIcon size={18} />}
              {safeMethod.toLowerCase().includes('flutterwave') && <FlutterwaveIcon size={18} />}
              <span>Pay {formatMoney(amountNaira)} via {safeMethod}</span>
            </>
          )}
        </button>

        {status && (
          <div
            role={statusType === 'error' ? 'alert' : 'status'}
            aria-live="polite"
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
            {statusType === 'success' ? <CheckCircle2 size={18} style={{ flexShrink: 0 }} aria-hidden="true" /> : statusType === 'error' ? <AlertCircle size={18} style={{ flexShrink: 0 }} aria-hidden="true" /> : <CreditCard size={18} style={{ flexShrink: 0 }} aria-hidden="true" />}
            <span>{status}</span>
          </div>
        )}
      </div>

      <div className="premium-card" style={{ display: 'flex', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
        <CheckCircle2 size={17} style={{ color: 'hsl(var(--color-gen))', flexShrink: 0 }} aria-hidden="true" />
        <span>7-day money-back guarantee if you are not fully satisfied with your solar projections.</span>
      </div>
    </div>
  );
}
