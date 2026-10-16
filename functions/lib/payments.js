'use strict';

const crypto = require('node:crypto');
const { getPlan, toMinorUnits } = require('./plans');

/**
 * Constant-time string comparison that does not leak length.
 * Both inputs are hashed to a fixed length first, so timingSafeEqual never throws.
 */
const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a ?? '')).digest();
  const hb = crypto.createHash('sha256').update(String(b ?? '')).digest();
  return crypto.timingSafeEqual(ha, hb) && String(a ?? '').length === String(b ?? '').length;
};

/** Paystack signs the RAW request body with HMAC-SHA512 using the secret key. */
const verifyPaystackSignature = (rawBody, signature, secret) => {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  return safeEqual(signature, expected);
};

/** Flutterwave sends the dashboard "secret hash" verbatim in the verif-hash header. */
const verifyFlutterwaveHash = (headerValue, secretHash) => {
  if (!headerValue || !secretHash) return false;
  return safeEqual(headerValue, secretHash);
};

class PaymentRejectedError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'PaymentRejectedError';
    this.code = code;
  }
}

/**
 * Decide whether a verified provider payment satisfies the server-created pending
 * transaction. EVERYTHING is checked against the pending record (written by our own
 * server when the checkout was initialised) - never against client-supplied metadata.
 *
 * @param {object} pending  pendingTransactions/{reference} document data
 * @param {object} paid     { provider, reference, status, amountMajor, currency }
 * @returns {object}        the matching plan config
 */
const assertPaymentMatches = (pending, paid) => {
  if (!pending) throw new PaymentRejectedError('unknown-reference', 'No pending transaction for this reference.');
  if (pending.provider !== paid.provider) {
    throw new PaymentRejectedError('provider-mismatch', `Reference was created for ${pending.provider}, not ${paid.provider}.`);
  }
  const plan = getPlan(pending.plan);
  if (!plan) throw new PaymentRejectedError('invalid-plan', 'Pending transaction references an unknown plan.');
  if (paid.status !== 'success') {
    throw new PaymentRejectedError('not-successful', `Provider reports status "${paid.status}".`);
  }
  if (String(paid.currency || '').toUpperCase() !== plan.currency) {
    throw new PaymentRejectedError('currency-mismatch', `Paid in ${paid.currency}, expected ${plan.currency}.`);
  }
  // Compare in minor units to avoid floating-point surprises (e.g. 5000.00 vs 4999.999999).
  if (toMinorUnits(paid.amountMajor) < toMinorUnits(plan.amount)) {
    throw new PaymentRejectedError('amount-mismatch', `Paid ${paid.amountMajor} ${paid.currency}, required ${plan.amount} ${plan.currency}.`);
  }
  if (pending.amount !== undefined && toMinorUnits(pending.amount) !== toMinorUnits(plan.amount)) {
    // Catalogue price changed after the checkout was created; honour what the buyer was quoted.
    if (toMinorUnits(paid.amountMajor) < toMinorUnits(pending.amount)) {
      throw new PaymentRejectedError('amount-mismatch', 'Paid amount is below the amount quoted at checkout.');
    }
  }
  return plan;
};

/** Reference format: sp_<uid-prefix>_<epoch>_<random>. Provider-safe characters only. */
const buildReference = (uid, nowMs = Date.now()) =>
  `sp_${String(uid).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}_${nowMs}_${crypto.randomBytes(4).toString('hex')}`;

const isValidReference = (ref) => typeof ref === 'string' && /^sp_[a-zA-Z0-9]{1,8}_\d{10,}_[a-f0-9]{8}$/.test(ref);

module.exports = {
  safeEqual,
  verifyPaystackSignature,
  verifyFlutterwaveHash,
  PaymentRejectedError,
  assertPaymentMatches,
  buildReference,
  isValidReference,
};
