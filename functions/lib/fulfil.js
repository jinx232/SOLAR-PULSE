'use strict';

const { assertPaymentMatches } = require('./payments');
const { computeExpiry } = require('./plans');

/**
 * Atomically fulfil a verified payment.
 *
 * Runs inside a Firestore transaction so that concurrent deliveries of the same
 * webhook (providers retry aggressively) can only ever activate the plan ONCE.
 *
 * @param {{db: object, Timestamp: object, FieldValue: object}} deps  injected for testability
 * @param {{provider:string, reference:string, providerTransactionId?:string,
 *          status:string, amountMajor:number, currency:string}} paid
 */
const fulfilPayment = async ({ db, Timestamp, FieldValue, nowMs = Date.now() }, paid) => {
  const pendingRef = db.collection('pendingTransactions').doc(paid.reference);

  return db.runTransaction(async (tx) => {
    const pendingSnap = await tx.get(pendingRef);
    const pending = pendingSnap.exists ? pendingSnap.data() : null;

    if (pending && pending.status === 'fulfilled') {
      return { alreadyProcessed: true, uid: pending.uid, plan: pending.plan };
    }

    // Throws PaymentRejectedError on unknown reference / provider / currency / amount mismatch.
    const plan = assertPaymentMatches(pending, paid);

    const subRef = db.collection('subscriptions').doc(pending.uid);
    const subSnap = await tx.get(subRef);
    const existing = subSnap.exists ? subSnap.data() : null;
    const existingExpiresAtMs = existing && existing.expiresAt && typeof existing.expiresAt.toMillis === 'function'
      ? existing.expiresAt.toMillis()
      : (existing && typeof existing.expiresAt === 'number' ? existing.expiresAt : 0);

    const expiresAtMs = computeExpiry({
      existing: existing ? { ...existing, expiresAtMs: existingExpiresAtMs } : null,
      planKey: plan.id,
      nowMs,
      durationDays: plan.durationDays,
    });

    tx.set(subRef, {
      uid: pending.uid,
      email: pending.email || '',
      plan: plan.id,
      status: 'active',
      provider: paid.provider,
      providerReference: paid.reference,
      amount: plan.amount,
      currency: plan.currency,
      activatedAt: existing && existing.status === 'active' && existing.plan === plan.id && existing.activatedAt
        ? existing.activatedAt
        : Timestamp.fromMillis(nowMs),
      expiresAt: Timestamp.fromMillis(expiresAtMs),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    tx.update(pendingRef, {
      status: 'fulfilled',
      fulfilledAt: FieldValue.serverTimestamp(),
      providerTransactionId: paid.providerTransactionId ? String(paid.providerTransactionId) : null,
    });

    // Immutable ledger entry (kept for accounting even if the account is later deleted).
    tx.set(db.collection('payments').doc(`${paid.provider}_${paid.reference}`), {
      uid: pending.uid,
      plan: plan.id,
      provider: paid.provider,
      reference: paid.reference,
      amount: paid.amountMajor,
      currency: plan.currency,
      status: 'success',
      createdAt: FieldValue.serverTimestamp(),
    });

    return { alreadyProcessed: false, uid: pending.uid, plan: plan.id, expiresAtMs };
  });
};

module.exports = { fulfilPayment };
