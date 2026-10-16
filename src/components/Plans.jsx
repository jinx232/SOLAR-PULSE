import React from 'react';
import { Check, CreditCard, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { isAdminUser } from '../utils/firebase';
import { PLAN_CATALOGUE, FREE_PLAN, getActivePlan, formatMoney } from '../utils/plans';

const plans = [
  {
    id: 'free',
    name: FREE_PLAN.name,
    price: 'Free',
    cadence: 'forever',
    description: FREE_PLAN.description,
    icon: <ShieldCheck size={22} />,
    features: FREE_PLAN.features,
    action: 'Current plan',
  },
  {
    id: 'pro',
    name: PLAN_CATALOGUE.pro.name,
    price: formatMoney(PLAN_CATALOGUE.pro.amount, PLAN_CATALOGUE.pro.currency),
    cadence: 'per month',
    description: PLAN_CATALOGUE.pro.description,
    icon: <Sparkles size={22} />,
    features: PLAN_CATALOGUE.pro.features,
    action: 'Upgrade to Pro',
    featured: true,
  },
  {
    id: 'installer',
    name: PLAN_CATALOGUE.installer.name,
    price: formatMoney(PLAN_CATALOGUE.installer.amount, PLAN_CATALOGUE.installer.currency),
    cadence: 'per month',
    description: PLAN_CATALOGUE.installer.description,
    icon: <Users size={22} />,
    features: PLAN_CATALOGUE.installer.features,
    action: 'Upgrade to Installer',
  },
];

export default function Plans({ user, subscription, onSelectPlan }) {
  const isAdmin = isAdminUser(user);
  const currentPlan = getActivePlan(subscription, { isAdmin });
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
            {plan.id === 'free' || plan.id === currentPlan ? (
              <button
                className="btn-outline"
                disabled
                aria-current="true"
                aria-label={`${plan.name} plan is your current active plan`}
                style={{ width: '100%', minHeight: '44px', marginTop: 'auto' }}
              >
                Current plan
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <button
                  className={plan.featured ? 'btn-primary' : 'btn-outline'}
                  onClick={() => onSelectPlan(plan)}
                  aria-label={`Upgrade to ${plan.name} plan for ${plan.price} ${plan.cadence}`}
                  style={{ width: '100%', minHeight: '44px' }}
                >
                  Upgrade to {plan.name}
                </button>
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
