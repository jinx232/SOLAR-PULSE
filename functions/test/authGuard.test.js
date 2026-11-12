'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MAX_FAILED_ATTEMPTS,
  BASE_LOCKOUT_MS,
  MAX_BURST_REQUESTS,
  MAX_WINDOW_REQUESTS,
  normalizeEmail,
  hashIdentifier,
  getLockoutDurationMs,
  evaluateRateLimit,
  evaluateAccountLockout,
  computeNextLockoutState,
} = require('../lib/authGuard');

test('normalizeEmail and hashIdentifier produce deterministic SHA-256 keys', () => {
  assert.equal(normalizeEmail('  Analyst@SolarPulse.io '), 'analyst@solarpulse.io');
  const hash1 = hashIdentifier('acct', 'Analyst@SolarPulse.io');
  const hash2 = hashIdentifier('acct', 'analyst@solarpulse.io');
  assert.equal(hash1, hash2);
  assert.ok(hash1.startsWith('acct_'));
  assert.equal(hash1.length, 5 + 32);
});

test('evaluateRateLimit enforces burst limit (5 requests per 60s)', () => {
  const now = 1_700_000_000_000;
  let record = { timestamps: [] };

  for (let i = 0; i < MAX_BURST_REQUESTS; i++) {
    const res = evaluateRateLimit(record, now + i * 1000);
    assert.equal(res.allowed, true);
    record = { timestamps: res.updatedTimestamps };
  }

  // 6th request within 60s must be blocked
  const blocked = evaluateRateLimit(record, now + 5000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, 'rate-limited-burst');
  assert.ok(blocked.retryAfterSeconds > 0 && blocked.retryAfterSeconds <= 60);

  // After 61s, burst window clears
  const allowedAfterBurst = evaluateRateLimit(record, now + 61_000);
  assert.equal(allowedAfterBurst.allowed, true);
});

test('evaluateRateLimit enforces 15-minute window limit (15 requests per 15m)', () => {
  const now = 1_700_000_000_000;
  // Space 15 requests 45 seconds apart so burst limit isn't triggered, but 15-minute window fills
  const timestamps = Array.from({ length: MAX_WINDOW_REQUESTS }, (_, idx) => now + idx * 45_000);
  const blocked = evaluateRateLimit({ timestamps }, now + 15 * 45_000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, 'rate-limited-window');
  assert.ok(blocked.retryAfterSeconds > 0);
});

test('computeNextLockoutState locks account after 5 failed attempts and escalates duration', () => {
  const now = 1_700_000_000_000;
  let state = {};

  for (let attempt = 1; attempt < MAX_FAILED_ATTEMPTS; attempt++) {
    state = computeNextLockoutState(state, { success: false, nowMs: now + attempt * 1000 });
    assert.equal(state.isLocked, false);
    assert.equal(state.failedAttempts, attempt);
    assert.equal(state.remainingAttempts, MAX_FAILED_ATTEMPTS - attempt);
  }

  // 5th failed attempt triggers 15-minute lockout
  state = computeNextLockoutState(state, { success: false, nowMs: now + 5000 });
  assert.equal(state.isLocked, true);
  assert.equal(state.remainingAttempts, 0);
  assert.equal(state.lockoutCount, 1);
  assert.equal(state.lockedUntilMs, now + 5000 + BASE_LOCKOUT_MS);

  // Guard check during lockout rejects login
  const checkWhileLocked = evaluateAccountLockout(state, now + 10_000);
  assert.equal(checkWhileLocked.allowed, false);
  assert.equal(checkWhileLocked.reason, 'account-locked');

  // Progressive escalation: 1st = 15m, 2nd = 30m, 3rd = 60m
  assert.equal(getLockoutDurationMs(1), 15 * 60 * 1000);
  assert.equal(getLockoutDurationMs(2), 30 * 60 * 1000);
  assert.equal(getLockoutDurationMs(3), 60 * 60 * 1000);

  // Successful login resets lockout and failed attempts
  const resetState = computeNextLockoutState(state, { success: true, nowMs: now + BASE_LOCKOUT_MS + 10_000 });
  assert.equal(resetState.isLocked, false);
  assert.equal(resetState.failedAttempts, 0);
  assert.equal(resetState.remainingAttempts, MAX_FAILED_ATTEMPTS);
});

