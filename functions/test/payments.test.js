'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const { PLAN_CATALOGUE, computeExpiry, toMinorUnits, fromMinorUnits, DAY_MS } = require('../lib/plans');
const {
  safeEqual,
  verifyPaystackSignature,
  verifyFlutterwaveHash,
  assertPaymentMatches,
  PaymentRejectedError,
  buildReference,
  isValidReference,
} = require('../lib/payments');
const { fulfilPayment } = require('../lib/fulfil');

/* ---------- minimal in-memory Firestore double (serialised transactions) ---------- */
class FakeDb {
  constructor() {
    this.store = new Map();
    this.chain = Promise.resolve();
  }
  collection(name) {
    return { doc: (id) => ({ path: `${name}/${id}` }) };
  }
  seed(path, data) {
    this.store.set(path, structuredClone(data));
  }
  read(path) {
    return this.store.get(path);
  }
  runTransaction(fn) {
    const run = async () => {
      const writes = [];
      const tx = {
        get: async (ref) => {
          const data = this.store.get(ref.path);
          return { exists: data !== undefined, data: () => (data === undefined ? undefined : { ...data }) };
        },
        set: (ref, data, opts) => writes.push({ ref, data, merge: opts && opts.merge }),
        update: (ref, data) => writes.push({ ref, data, update: true }),
      };
      const result = await fn(tx);
      for (const w of writes) {
        const current = this.store.get(w.ref.path);
        this.store.set(w.ref.path, w.merge || w.update ? { ...(current || {}), ...w.data } : { ...w.data });
      }
      return result;
    };
    const p = this.chain.then(run);
    this.chain = p.catch(() => {});
    return p;
  }
}
const Timestamp = { fromMillis: (ms) => ({ toMillis: () => ms }) };
const FieldValue = { serverTimestamp: () => '__server_ts__' };

const NOW = Date.UTC(2026, 0, 10, 12, 0, 0);
const makePending = (overrides = {}) => ({
  uid: 'user-1',
  email: 'buyer@example.com',
  plan: 'pro',
  provider: 'paystack',
  amount: 5000,
  currency: 'NGN',
  status: 'pending',
  ...overrides,
});
const paidFor = (reference, overrides = {}) => ({
  provider: 'paystack',
  reference,
  status: 'success',
  amountMajor: 5000,
  currency: 'NGN',
  ...overrides,
});

/* ---------------------------------- unit tests ---------------------------------- */

test('minor unit conversion round-trips and avoids float drift', () => {
  assert.equal(toMinorUnits(5000), 500000);
  assert.equal(toMinorUnits(0.1 + 0.2), 30);
  assert.equal(fromMinorUnits(500000), 5000);
});

test('catalogue prices are sane and server-defined', () => {
  assert.equal(PLAN_CATALOGUE.pro.currency, 'NGN');
  assert.ok(PLAN_CATALOGUE.installer.amount > PLAN_CATALOGUE.pro.amount);
});

test('safeEqual: equal, different, different length, empty/undefined', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('abc', 'abcd'), false);
  assert.equal(safeEqual(undefined, undefined), true);
  assert.equal(safeEqual('x', undefined), false);
});

test('paystack signature: valid, tampered body, wrong secret, missing header', () => {
  const body = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'r' } }));
  const secret = 'sk_test_secret';
  const sig = crypto.createHmac('sha512', secret).update(body).digest('hex');
  assert.equal(verifyPaystackSignature(body, sig, secret), true);
  assert.equal(verifyPaystackSignature(Buffer.from('{"tampered":1}'), sig, secret), false);
  assert.equal(verifyPaystackSignature(body, sig, 'other'), false);
  assert.equal(verifyPaystackSignature(body, undefined, secret), false);
});

test('flutterwave hash: valid, wrong, missing', () => {
  assert.equal(verifyFlutterwaveHash('hash123', 'hash123'), true);
  assert.equal(verifyFlutterwaveHash('hash124', 'hash123'), false);
  assert.equal(verifyFlutterwaveHash(undefined, 'hash123'), false);
  assert.equal(verifyFlutterwaveHash('hash123', ''), false);
});

test('references are well-formed and validated', () => {
  const ref = buildReference('Abc-123_xyz', NOW);
  assert.ok(isValidReference(ref), ref);
  assert.equal(isValidReference('not-a-ref'), false);
  assert.equal(isValidReference(undefined), false);
  assert.notEqual(buildReference('u', NOW), buildReference('u', NOW));
});

test('assertPaymentMatches accepts exact and over-payment', () => {
  assert.equal(assertPaymentMatches(makePending(), paidFor('r')).id, 'pro');
  assert.equal(assertPaymentMatches(makePending(), paidFor('r', { amountMajor: 5500 })).id, 'pro');
});

test('assertPaymentMatches honors quoted pending amount even if catalogue price changed', () => {
  // Suppose user was quoted 4000 NGN in pending record, while catalogue is 5000 NGN
  const pendingQuotedLower = makePending({ amount: 4000 });
  assert.equal(assertPaymentMatches(pendingQuotedLower, paidFor('r', { amountMajor: 4000 })).id, 'pro');
});

test('assertPaymentMatches rejects every kind of mismatch', () => {
  const expectCode = (pending, paid, code) =>
    assert.throws(() => assertPaymentMatches(pending, paid), (e) => e instanceof PaymentRejectedError && e.code === code);

  expectCode(null, paidFor('r'), 'unknown-reference');
  expectCode(makePending(), paidFor('r', { provider: 'flutterwave' }), 'provider-mismatch');
  expectCode(makePending({ plan: 'platinum' }), paidFor('r'), 'invalid-plan');
  expectCode(makePending(), paidFor('r', { status: 'failed' }), 'not-successful');
  expectCode(makePending(), paidFor('r', { currency: 'USD' }), 'currency-mismatch');
  expectCode(makePending(), paidFor('r', { amountMajor: 4999 }), 'amount-mismatch');
  // Paystack kobo bug: 500000 kobo stored unconverted would look like 500000 NGN - still accepted as >=,
  // but a kobo value mistakenly treated as naira on the LOW side must fail:
  expectCode(makePending(), paidFor('r', { amountMajor: 50 }), 'amount-mismatch');
});

test('computeExpiry: fresh, extend same plan, expired, plan switch', () => {
  const d = 30;
  assert.equal(computeExpiry({ existing: null, planKey: 'pro', nowMs: NOW, durationDays: d }), NOW + d * DAY_MS);
  const activeUntil = NOW + 10 * DAY_MS;
  assert.equal(
    computeExpiry({ existing: { status: 'active', plan: 'pro', expiresAtMs: activeUntil }, planKey: 'pro', nowMs: NOW, durationDays: d }),
    activeUntil + d * DAY_MS,
    'renewing early must not waste remaining days',
  );
  assert.equal(
    computeExpiry({ existing: { status: 'expired', plan: 'pro', expiresAtMs: NOW - DAY_MS }, planKey: 'pro', nowMs: NOW, durationDays: d }),
    NOW + d * DAY_MS,
  );
  assert.equal(
    computeExpiry({ existing: { status: 'active', plan: 'pro', expiresAtMs: activeUntil }, planKey: 'installer', nowMs: NOW, durationDays: d }),
    NOW + d * DAY_MS,
  );
});

/* ------------------------------- fulfilment tests ------------------------------- */

test('fulfilPayment activates the SERVER-decided plan with expiry + ledger entry', async () => {
  const db = new FakeDb();
  const ref = buildReference('user-1', NOW);
  db.seed(`pendingTransactions/${ref}`, makePending());

  const result = await fulfilPayment({ db, Timestamp, FieldValue, nowMs: NOW }, paidFor(ref));
  assert.equal(result.alreadyProcessed, false);
  const sub = db.read('subscriptions/user-1');
  assert.equal(sub.plan, 'pro');
  assert.equal(sub.status, 'active');
  assert.equal(sub.currency, 'NGN');
  assert.equal(sub.expiresAt.toMillis(), NOW + 30 * DAY_MS);
  assert.equal(db.read(`pendingTransactions/${ref}`).status, 'fulfilled');
  assert.ok(db.read(`payments/paystack_${ref}`));
});

test('fulfilPayment cannot be tricked into granting a higher plan (Pro paid, Installer claimed)', async () => {
  const db = new FakeDb();
  const ref = buildReference('user-1', NOW);
  db.seed(`pendingTransactions/${ref}`, makePending({ plan: 'pro' }));
  // Attacker-controlled metadata is irrelevant: fulfilPayment never reads it.
  await fulfilPayment({ db, Timestamp, FieldValue, nowMs: NOW }, { ...paidFor(ref), metadata: { plan: 'installer' } });
  assert.equal(db.read('subscriptions/user-1').plan, 'pro');
});

test('fulfilPayment is idempotent, even under concurrent webhook deliveries', async () => {
  const db = new FakeDb();
  const ref = buildReference('user-1', NOW);
  db.seed(`pendingTransactions/${ref}`, makePending());
  const results = await Promise.all(
    Array.from({ length: 5 }, () => fulfilPayment({ db, Timestamp, FieldValue, nowMs: NOW }, paidFor(ref))),
  );
  assert.equal(results.filter((r) => r.alreadyProcessed === false).length, 1);
  assert.equal(db.read('subscriptions/user-1').expiresAt.toMillis(), NOW + 30 * DAY_MS, 'replay must not extend expiry');
});

test('fulfilPayment rejects underpayment and writes nothing', async () => {
  const db = new FakeDb();
  const ref = buildReference('user-1', NOW);
  db.seed(`pendingTransactions/${ref}`, makePending());
  await assert.rejects(
    fulfilPayment({ db, Timestamp, FieldValue, nowMs: NOW }, paidFor(ref, { amountMajor: 100 })),
    PaymentRejectedError,
  );
  assert.equal(db.read('subscriptions/user-1'), undefined);
  assert.equal(db.read(`pendingTransactions/${ref}`).status, 'pending');
});

test('fulfilPayment rejects an unknown reference (forged webhook for a payment we never created)', async () => {
  const db = new FakeDb();
  await assert.rejects(
    fulfilPayment({ db, Timestamp, FieldValue, nowMs: NOW }, paidFor(buildReference('x', NOW))),
    (e) => e.code === 'unknown-reference',
  );
});

test('renewal before expiry extends rather than resets', async () => {
  const db = new FakeDb();
  const first = buildReference('user-1', NOW);
  const second = buildReference('user-1', NOW + 1);
  db.seed(`pendingTransactions/${first}`, makePending());
  db.seed(`pendingTransactions/${second}`, makePending());
  await fulfilPayment({ db, Timestamp, FieldValue, nowMs: NOW }, paidFor(first));
  await fulfilPayment({ db, Timestamp, FieldValue, nowMs: NOW + 5 * DAY_MS }, paidFor(second));
  assert.equal(db.read('subscriptions/user-1').expiresAt.toMillis(), NOW + 60 * DAY_MS);
});
