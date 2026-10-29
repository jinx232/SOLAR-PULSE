'use strict';

/**
 * Authoritative plan catalogue. The server is the ONLY place a price is decided:
 * the client never sends an amount, and webhooks never trust client metadata.
 *
 * Keep in sync with src/utils/plans.js — a unit test (src/utils/plans.test.js)
 * fails if the two catalogues drift apart.
 *
 * Amounts are expressed in MAJOR units (naira, not kobo).
 */
const PLAN_CATALOGUE = Object.freeze({
  audit: Object.freeze({ id: 'audit', name: 'Homeowner Audit Pass', amount: 3500, currency: 'NGN', durationDays: 7 }),
  pro: Object.freeze({ id: 'pro', name: 'Pro', amount: 5000, currency: 'NGN', durationDays: 30 }),
  installer: Object.freeze({ id: 'installer', name: 'Installer', amount: 15000, currency: 'NGN', durationDays: 30 }),
});

const DAY_MS = 24 * 60 * 60 * 1000;

const getPlan = (planKey) => PLAN_CATALOGUE[String(planKey || '').toLowerCase()] || null;

/** Paystack (and most card gateways) take the smallest currency unit. */
const toMinorUnits = (amountMajor) => Math.round(Number(amountMajor) * 100);
const fromMinorUnits = (amountMinor) => Number(amountMinor) / 100;

/**
 * Renewal logic for prepaid, non-recurring plans.
 * - Same plan still active  -> extend from the current expiry (no days lost).
 * - Expired / different plan -> start fresh from "now".
 */
const computeExpiry = ({ existing, planKey, nowMs, durationDays }) => {
  const existingExpiry = existing && typeof existing.expiresAtMs === 'number' ? existing.expiresAtMs : 0;
  const stillActive = existing && existing.status === 'active' && existingExpiry > nowMs;
  const base = stillActive && existing.plan === planKey ? existingExpiry : nowMs;
  return base + durationDays * DAY_MS;
};

module.exports = { PLAN_CATALOGUE, DAY_MS, getPlan, toMinorUnits, fromMinorUnits, computeExpiry };
