import { describe, it, expect } from 'vitest';
import { PLAN_CATALOGUE, FREE_PLAN, ENTITLEMENTS, getActivePlan, getEntitlements, formatMoney, daysRemaining } from './plans';
// Also verify parity with functions/lib/plans.js
import { PLAN_CATALOGUE as SERVER_PLANS } from '../../functions/lib/plans.js';

describe('plans and entitlements module', () => {
  it('guarantees client and server catalogue price and currency parity', () => {
    expect(PLAN_CATALOGUE.audit.amount).toBe(SERVER_PLANS.audit.amount);
    expect(PLAN_CATALOGUE.audit.currency).toBe(SERVER_PLANS.audit.currency);
    expect(PLAN_CATALOGUE.pro.amount).toBe(SERVER_PLANS.pro.amount);
    expect(PLAN_CATALOGUE.pro.currency).toBe(SERVER_PLANS.pro.currency);
    expect(PLAN_CATALOGUE.installer.amount).toBe(SERVER_PLANS.installer.amount);
    expect(PLAN_CATALOGUE.installer.currency).toBe(SERVER_PLANS.installer.currency);
    expect(FREE_PLAN.id).toBe('free');
    expect(ENTITLEMENTS.free.reportExport).toBe(false);
    expect(ENTITLEMENTS.audit.reportExport).toBe(true);
    expect(ENTITLEMENTS.pro.reportExport).toBe(true);
  });

  it('determines active plan accurately based on expiry and admin status', () => {
    const now = Date.now();
    expect(getActivePlan(null, { isAdmin: true })).toBe('admin');
    expect(getActivePlan(null)).toBe('free');
    expect(getActivePlan({ status: 'inactive', plan: 'pro' })).toBe('free');

    // Valid active plan before expiry
    const activeSub = {
      status: 'active',
      plan: 'pro',
      expiresAt: now + 86400000 * 10
    };
    expect(getActivePlan(activeSub, { now })).toBe('pro');

    // Expired plan reverts to free
    const expiredSub = {
      status: 'active',
      plan: 'pro',
      expiresAt: now - 1000
    };
    expect(getActivePlan(expiredSub, { now })).toBe('free');
  });

  it('provides appropriate feature entitlements per plan', () => {
    const free = getEntitlements(null);
    expect(free.maxProjects).toBe(1);
    expect(free.reportExport).toBe(false);
    expect(free.guideDailyLimit).toBe(5);

    const pro = getEntitlements({ status: 'active', plan: 'pro', expiresAt: Date.now() + 100000 });
    expect(pro.maxProjects).toBe(Infinity);
    expect(pro.reportExport).toBe(true);
    expect(pro.guideDailyLimit).toBe(Infinity);
  });

  it('formats money and calculates days remaining', () => {
    const formatted = formatMoney(5000, 'NGN');
    expect(formatted).toContain('5,000');

    const now = 1000000000000;
    const sub = { expiresAt: now + 86400000 * 5 };
    expect(daysRemaining(sub, now)).toBe(5);

    expect(daysRemaining({ expiresAt: now - 5000 }, now)).toBe(0);
  });
});
