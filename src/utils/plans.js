/**
 * Client-side plan catalogue + feature gating.
 *
 * PRICES here are for DISPLAY only. The server (functions/lib/plans.js) is the single
 * authority on what is charged; src/utils/plans.test.js fails if the two ever drift.
 */

export const PLAN_CATALOGUE = {
  pro: {
    id: 'pro',
    name: 'Pro',
    amount: 5000,
    currency: 'NGN',
    durationDays: 30,
    description: 'For homeowners who want deeper planning and shareable results.',
    features: ['Unlimited saved projects', 'Report export (print / PDF)', 'No daily limit on the Solar Guide', 'Detailed 25-year cash-flow table'],
  },
  installer: {
    id: 'installer',
    name: 'Installer',
    amount: 15000,
    currency: 'NGN',
    durationDays: 30,
    description: 'A faster proposal workspace for solar professionals.',
    features: ['Everything in Pro', 'Unlimited saved customer projects', 'Report export with your business name'],
  },
};

export const FREE_PLAN = {
  id: 'free',
  name: 'Free',
  description: 'Size a system and simulate a blackout before you commit.',
  features: ['Appliance sizing calculator', 'Battery outage simulator', 'Cost & ROI projections', '1 saved project', 'Solar Guide: 5 questions per day'],
};

/** What each plan unlocks. `Infinity` = unlimited. */
export const ENTITLEMENTS = {
  free: { maxProjects: 1, reportExport: false, guideDailyLimit: 5, detailedCashflow: false },
  pro: { maxProjects: Infinity, reportExport: true, guideDailyLimit: Infinity, detailedCashflow: true },
  installer: { maxProjects: Infinity, reportExport: true, guideDailyLimit: Infinity, detailedCashflow: true },
  admin: { maxProjects: Infinity, reportExport: true, guideDailyLimit: Infinity, detailedCashflow: true },
};

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * The plan a user is ENTITLED to right now. A stored `status: 'active'` is not
 * enough: the subscription must also not be past its expiry, so lapsed plans
 * lose access even if the server-side sweep has not run yet.
 */
export const getActivePlan = (subscription, { isAdmin = false, now = Date.now() } = {}) => {
  if (isAdmin) return 'admin';
  if (!subscription || subscription.status !== 'active') return 'free';
  const plan = String(subscription.plan || '').toLowerCase();
  if (!ENTITLEMENTS[plan] || plan === 'admin') return 'free';
  const expiresAt = toMillis(subscription.expiresAt);
  if (!expiresAt || expiresAt <= now) return 'free';
  return plan;
};

export const getEntitlements = (subscription, options) => ENTITLEMENTS[getActivePlan(subscription, options)];

export const formatMoney = (amount, currency = 'NGN', locale) =>
  new Intl.NumberFormat(locale || (currency === 'NGN' ? 'en-NG' : undefined), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

export const daysRemaining = (subscription, now = Date.now()) => {
  const expiresAt = toMillis(subscription?.expiresAt);
  return expiresAt > now ? Math.ceil((expiresAt - now) / 86400000) : 0;
};
