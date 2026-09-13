import React from 'react';
import { Check, CreditCard, ShieldCheck, Sparkles, Users } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    description: 'Explore your home energy profile before committing to a plan.',
    icon: <ShieldCheck size={22} />,
    features: ['Solar sizing calculator', 'Battery outage simulator', 'Basic dashboard', 'One saved project'],
    action: 'Current plan',
  },
  {
    name: 'Pro',
    price: 'NGN 5,000',
    cadence: 'per month',
    description: 'For homeowners who want deeper planning and shareable results.',
    icon: <Sparkles size={22} />,
    features: ['Unlimited saved projects', 'Advanced ROI projections', 'Professional report exports', 'Expanded AI advisor access'],
    action: 'Join Pro waitlist',
    featured: true,
  },
  {
    name: 'Installer',
    price: 'NGN 50,000',
    cadence: 'per month',
    description: 'A faster proposal workspace for solar professionals and teams.',
    icon: <Users size={22} />,
    features: ['Client-ready project reports', 'Multiple customer projects', 'Branded proposals', 'Team workspace roadmap'],
    action: 'Contact sales',
  },
];

export default function Plans({ user, subscription, onSelectPlan }) {
  const isAdmin = user?.email?.toLowerCase() === 'odumesamuel52@gmail.com';
  const currentPlan = isAdmin ? 'admin' : (subscription?.plan || 'free');
  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'hsl(var(--color-solar))', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          <CreditCard size={18} /> Plans & access
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px' }}>Choose your Solar Pulse plan</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '680px', marginTop: '4px' }}>Start free, then upgrade when you need deeper analysis, saved projects, and professional client workflows.</p>
      </div>

      <div className="grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className="premium-card" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            border: plan.featured ? '1px solid hsl(var(--color-solar))' : '1px solid var(--border-color)',
            boxShadow: plan.featured ? '0 18px 40px -26px rgba(249, 115, 22, 0.8)' : 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: plan.featured ? 'hsl(var(--color-solar))' : 'hsl(var(--color-bat))' }}>{plan.icon}</span>
              {plan.featured && <span style={{ fontSize: '0.7rem', color: 'hsl(var(--color-solar))', fontWeight: 800, textTransform: 'uppercase' }}>Recommended</span>}
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>{plan.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px', minHeight: '42px' }}>{plan.description}</p>
            </div>
            <div>
              <strong style={{ fontSize: '2rem' }}>{plan.price}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '6px' }}>{plan.cadence}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              {plan.features.map((feature) => (
                <span key={feature} style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <Check size={16} style={{ color: 'hsl(var(--color-gen))', flexShrink: 0 }} /> {feature}
                </span>
              ))}
            </div>
            {plan.name === 'Free' || plan.name.toLowerCase() === currentPlan ? (
              <button className="btn-outline" disabled style={{ width: '100%', minHeight: '44px', marginTop: 'auto' }}>Current plan</button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <button className={plan.featured ? 'btn-primary' : 'btn-outline'} onClick={() => onSelectPlan(plan)} style={{ width: '100%', minHeight: '44px' }}>Pay</button>
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        <ShieldCheck size={20} style={{ color: 'hsl(var(--color-gen))', flexShrink: 0 }} />
        <span>You are using the <strong>{currentPlan === 'admin' ? 'Admin' : currentPlan}</strong> plan. Paid access activates only after server-side payment verification.</span>
      </div>
    </div>
  );
}
