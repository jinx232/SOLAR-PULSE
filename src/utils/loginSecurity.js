// Login Rate Limiting & Progressive Account Lockout Engine
// Works in tandem with server-side Cloud Functions (checkLoginGuard / recordLoginAttempt)
// and Firebase Auth's native anti-abuse signals.

export const MAX_FAILED_ATTEMPTS = 5;
export const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const BASE_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes (1st lockout)
export const MAX_LOCKOUT_MS = 60 * 60 * 1000; // 60 minutes cap

export const BURST_WINDOW_MS = 60 * 1000; // 60 seconds
export const MAX_BURST_REQUESTS = 5; // max 5 login attempts per minute
export const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_WINDOW_REQUESTS = 15; // max 15 login attempts per 15 minutes

const STORAGE_KEY = 'sp_login_security_v1';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const loadGuardStore = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { timestamps: [], accounts: {} };
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { timestamps: [], accounts: {} };
    const parsed = JSON.parse(raw);
    return {
      timestamps: Array.isArray(parsed?.timestamps) ? parsed.timestamps : [],
      accounts: parsed?.accounts && typeof parsed.accounts === 'object' ? parsed.accounts : {},
    };
  } catch (_) {
    return { timestamps: [], accounts: {} };
  }
};

const saveGuardStore = (store) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  } catch (_) {}
};

export const getLockoutDurationMs = (lockoutCount = 1) => {
  const multiplier = Math.pow(2, Math.max(0, lockoutCount - 1));
  return Math.min(MAX_LOCKOUT_MS, BASE_LOCKOUT_MS * multiplier);
};

export const formatLockoutCountdown = (totalSeconds) => {
  const secs = Math.max(0, Math.ceil(Number(totalSeconds || 0)));
  const minutes = Math.floor(secs / 60);
  const remSeconds = secs % 60;
  if (minutes > 0) {
    return `${minutes}m ${String(remSeconds).padStart(2, '0')}s`;
  }
  return `${remSeconds}s`;
};

/**
 * Inspect current lockout / rate-limit state without mutating counters.
 */
export const getAccountSecurityStatus = (email, nowMs = Date.now()) => {
  const store = loadGuardStore();
  const key = normalizeEmail(email);
  const recentTimestamps = store.timestamps.filter((ts) => nowMs - ts < RATE_WINDOW_MS);
  const burstTimestamps = recentTimestamps.filter((ts) => nowMs - ts < BURST_WINDOW_MS);

  // 1. Check account-specific lockout first
  const acct = (key && store.accounts[key]) || {};
  if (acct.lockedUntilMs && acct.lockedUntilMs > nowMs) {
    const retryAfterSeconds = Math.ceil((acct.lockedUntilMs - nowMs) / 1000);
    return {
      allowed: false,
      isLocked: true,
      isRateLimited: false,
      reason: 'account-locked',
      lockedUntilMs: acct.lockedUntilMs,
      retryAfterSeconds,
      failedAttempts: acct.failedAttempts || MAX_FAILED_ATTEMPTS,
      remainingAttempts: 0,
      lockoutCount: acct.lockoutCount || 1,
    };
  }

  // 2. Check burst rate limit (max 5 requests per 60 seconds)
  if (burstTimestamps.length >= MAX_BURST_REQUESTS) {
    const oldestBurst = Math.min(...burstTimestamps);
    const lockedUntilMs = oldestBurst + BURST_WINDOW_MS;
    const retryAfterSeconds = Math.max(1, Math.ceil((lockedUntilMs - nowMs) / 1000));
    return {
      allowed: false,
      isLocked: false,
      isRateLimited: true,
      reason: 'rate-limited',
      lockedUntilMs,
      retryAfterSeconds,
      failedAttempts: acct.failedAttempts || 0,
      remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - (acct.failedAttempts || 0)),
      lockoutCount: acct.lockoutCount || 0,
    };
  }

  // 3. Check 15-minute window rate limit (max 15 requests per 15 minutes)
  if (recentTimestamps.length >= MAX_WINDOW_REQUESTS) {
    const oldestWindow = Math.min(...recentTimestamps);
    const lockedUntilMs = oldestWindow + RATE_WINDOW_MS;
    const retryAfterSeconds = Math.max(1, Math.ceil((lockedUntilMs - nowMs) / 1000));
    return {
      allowed: false,
      isLocked: false,
      isRateLimited: true,
      reason: 'rate-limited',
      lockedUntilMs,
      retryAfterSeconds,
      failedAttempts: acct.failedAttempts || 0,
      remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - (acct.failedAttempts || 0)),
      lockoutCount: acct.lockoutCount || 0,
    };
  }

  const windowExpired = acct.lastFailedAtMs && nowMs - acct.lastFailedAtMs > ATTEMPT_WINDOW_MS;
  const activeFailedAttempts = windowExpired || (acct.lockedUntilMs && acct.lockedUntilMs <= nowMs)
    ? 0
    : Number(acct.failedAttempts || 0);

  return {
    allowed: true,
    isLocked: false,
    isRateLimited: false,
    reason: null,
    lockedUntilMs: 0,
    retryAfterSeconds: 0,
    failedAttempts: activeFailedAttempts,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - activeFailedAttempts),
    lockoutCount: Number(acct.lockoutCount || 0),
  };
};

/**
 * Consume a rate-limit slot before attempting authentication.
 */
export const consumeRateLimitSlot = (email, nowMs = Date.now()) => {
  const status = getAccountSecurityStatus(email, nowMs);
  if (!status.allowed) {
    return status;
  }

  const store = loadGuardStore();
  store.timestamps = [
    ...store.timestamps.filter((ts) => nowMs - ts < RATE_WINDOW_MS),
    nowMs,
  ];
  saveGuardStore(store);
  return status;
};

/**
 * Record the outcome of a login attempt locally (and sync server state if provided).
 */
export const recordLocalLoginOutcome = (email, { success = false, forceLockoutMs = 0, serverState = null } = {}) => {
  const nowMs = Date.now();
  const key = normalizeEmail(email);
  if (!key) return getAccountSecurityStatus(email, nowMs);

  const store = loadGuardStore();
  const prev = store.accounts[key] || {};

  if (serverState && typeof serverState === 'object') {
    store.accounts[key] = {
      failedAttempts: Number(serverState.failedAttempts ?? prev.failedAttempts ?? 0),
      lockedUntilMs: Number(serverState.lockedUntilMs ?? 0),
      lockoutCount: Number(serverState.lockoutCount ?? prev.lockoutCount ?? 0),
      lastFailedAtMs: success ? 0 : nowMs,
    };
    saveGuardStore(store);
    return getAccountSecurityStatus(key, nowMs);
  }

  if (success) {
    delete store.accounts[key];
    saveGuardStore(store);
    return getAccountSecurityStatus(key, nowMs);
  }

  const statusBefore = getAccountSecurityStatus(key, nowMs);
  const nextFailedAttempts = forceLockoutMs > 0
    ? MAX_FAILED_ATTEMPTS
    : statusBefore.failedAttempts + 1;

  if (nextFailedAttempts >= MAX_FAILED_ATTEMPTS || forceLockoutMs > 0) {
    const nextLockoutCount = Number(prev.lockoutCount || 0) + 1;
    const durationMs = forceLockoutMs > 0 ? forceLockoutMs : getLockoutDurationMs(nextLockoutCount);
    store.accounts[key] = {
      failedAttempts: nextFailedAttempts,
      lockedUntilMs: nowMs + durationMs,
      lockoutCount: nextLockoutCount,
      lastFailedAtMs: nowMs,
    };
  } else {
    store.accounts[key] = {
      failedAttempts: nextFailedAttempts,
      lockedUntilMs: 0,
      lockoutCount: Number(prev.lockoutCount || 0),
      lastFailedAtMs: nowMs,
    };
  }

  saveGuardStore(store);
  return getAccountSecurityStatus(key, nowMs);
};

