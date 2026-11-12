'use strict';

const crypto = require('crypto');

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BASE_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes (1st lockout)
const MAX_LOCKOUT_MS = 60 * 60 * 1000; // 60 minutes cap

const BURST_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_BURST_REQUESTS = 5; // max 5 login requests per minute per IP/client
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_WINDOW_REQUESTS = 15; // max 15 login requests per 15 minutes per IP/client

class AuthGuardError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'AuthGuardError';
    this.code = code; // 'account-locked' | 'rate-limited'
    this.details = details;
  }
}

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const hashIdentifier = (prefix, value) => {
  const normalized = String(value || 'unknown').trim().toLowerCase();
  const digest = crypto.createHash('sha256').update(`${prefix}:${normalized}`).digest('hex');
  return `${prefix}_${digest.slice(0, 32)}`;
};

/**
 * Progressive lockout duration:
 * 1st lockout -> 15 min, 2nd -> 30 min, 3rd+ -> 60 min
 */
const getLockoutDurationMs = (lockoutCount = 1) => {
  const multiplier = Math.pow(2, Math.max(0, lockoutCount - 1));
  return Math.min(MAX_LOCKOUT_MS, BASE_LOCKOUT_MS * multiplier);
};

/**
 * Pure evaluation of sliding-window rate limit state.
 */
const evaluateRateLimit = (existingRecord = {}, nowMs = Date.now()) => {
  const recentTimestamps = Array.isArray(existingRecord.timestamps)
    ? existingRecord.timestamps.filter((ts) => typeof ts === 'number' && nowMs - ts < RATE_WINDOW_MS)
    : [];

  const burstTimestamps = recentTimestamps.filter((ts) => nowMs - ts < BURST_WINDOW_MS);

  if (burstTimestamps.length >= MAX_BURST_REQUESTS) {
    const oldestBurst = Math.min(...burstTimestamps);
    const retryAfterMs = Math.max(1000, BURST_WINDOW_MS - (nowMs - oldestBurst));
    return {
      allowed: false,
      reason: 'rate-limited-burst',
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      lockedUntilMs: nowMs + retryAfterMs,
      updatedTimestamps: recentTimestamps,
    };
  }

  if (recentTimestamps.length >= MAX_WINDOW_REQUESTS) {
    const oldestWindow = Math.min(...recentTimestamps);
    const retryAfterMs = Math.max(1000, RATE_WINDOW_MS - (nowMs - oldestWindow));
    return {
      allowed: false,
      reason: 'rate-limited-window',
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      lockedUntilMs: nowMs + retryAfterMs,
      updatedTimestamps: recentTimestamps,
    };
  }

  return {
    allowed: true,
    reason: null,
    retryAfterSeconds: 0,
    lockedUntilMs: 0,
    updatedTimestamps: [...recentTimestamps, nowMs],
  };
};

/**
 * Pure evaluation of account lockout state before attempting login.
 */
const evaluateAccountLockout = (existingRecord = {}, nowMs = Date.now()) => {
  const lockedUntilMs = Number(existingRecord.lockedUntilMs || 0);
  const lastFailedAtMs = Number(existingRecord.lastFailedAtMs || 0);
  const windowExpired = lastFailedAtMs > 0 && nowMs - lastFailedAtMs > ATTEMPT_WINDOW_MS;

  if (lockedUntilMs > nowMs) {
    const retryAfterSeconds = Math.ceil((lockedUntilMs - nowMs) / 1000);
    return {
      allowed: false,
      reason: 'account-locked',
      retryAfterSeconds,
      lockedUntilMs,
      failedAttempts: Number(existingRecord.failedAttempts || MAX_FAILED_ATTEMPTS),
      remainingAttempts: 0,
      lockoutCount: Number(existingRecord.lockoutCount || 1),
    };
  }

  const activeFailedAttempts = windowExpired || lockedUntilMs > 0
    ? 0
    : Number(existingRecord.failedAttempts || 0);

  return {
    allowed: true,
    reason: null,
    retryAfterSeconds: 0,
    lockedUntilMs: 0,
    failedAttempts: activeFailedAttempts,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - activeFailedAttempts),
    lockoutCount: Number(existingRecord.lockoutCount || 0),
  };
};

/**
 * Pure computation of the next account lockout state after a login attempt.
 */
const computeNextLockoutState = (existingRecord = {}, { success = false, nowMs = Date.now() } = {}) => {
  if (success) {
    return {
      failedAttempts: 0,
      lockedUntilMs: 0,
      lockoutCount: 0,
      lastFailedAtMs: 0,
      lastSuccessAtMs: nowMs,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
      isLocked: false,
      retryAfterSeconds: 0,
    };
  }

  const prevEval = evaluateAccountLockout(existingRecord, nowMs);
  if (!prevEval.allowed) {
    return {
      failedAttempts: prevEval.failedAttempts,
      lockedUntilMs: prevEval.lockedUntilMs,
      lockoutCount: prevEval.lockoutCount,
      lastFailedAtMs: Number(existingRecord.lastFailedAtMs || nowMs),
      lastSuccessAtMs: Number(existingRecord.lastSuccessAtMs || 0),
      remainingAttempts: 0,
      isLocked: true,
      retryAfterSeconds: prevEval.retryAfterSeconds,
    };
  }

  const nextFailedAttempts = prevEval.failedAttempts + 1;
  if (nextFailedAttempts >= MAX_FAILED_ATTEMPTS) {
    const nextLockoutCount = Number(existingRecord.lockoutCount || 0) + 1;
    const durationMs = getLockoutDurationMs(nextLockoutCount);
    const lockedUntilMs = nowMs + durationMs;
    return {
      failedAttempts: nextFailedAttempts,
      lockedUntilMs,
      lockoutCount: nextLockoutCount,
      lastFailedAtMs: nowMs,
      lastSuccessAtMs: Number(existingRecord.lastSuccessAtMs || 0),
      remainingAttempts: 0,
      isLocked: true,
      retryAfterSeconds: Math.ceil(durationMs / 1000),
    };
  }

  return {
    failedAttempts: nextFailedAttempts,
    lockedUntilMs: 0,
    lockoutCount: Number(existingRecord.lockoutCount || 0),
    lastFailedAtMs: nowMs,
    lastSuccessAtMs: Number(existingRecord.lastSuccessAtMs || 0),
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - nextFailedAttempts),
    isLocked: false,
    retryAfterSeconds: 0,
  };
};

module.exports = {
  MAX_FAILED_ATTEMPTS,
  ATTEMPT_WINDOW_MS,
  BASE_LOCKOUT_MS,
  MAX_LOCKOUT_MS,
  BURST_WINDOW_MS,
  MAX_BURST_REQUESTS,
  RATE_WINDOW_MS,
  MAX_WINDOW_REQUESTS,
  AuthGuardError,
  normalizeEmail,
  hashIdentifier,
  getLockoutDurationMs,
  evaluateRateLimit,
  evaluateAccountLockout,
  computeNextLockoutState,
};

