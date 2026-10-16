'use strict';

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret, defineString } = require('firebase-functions/params');

const { getPlan, toMinorUnits, fromMinorUnits } = require('./lib/plans');
const {
  verifyPaystackSignature,
  verifyFlutterwaveHash,
  PaymentRejectedError,
  buildReference,
  isValidReference,
} = require('./lib/payments');
const { fulfilPayment } = require('./lib/fulfil');

// Explicit region (closest supported region to West Africa). Change here AND set
// VITE_FUNCTIONS_REGION in the web app's .env to the same value.
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

initializeApp();
const db = getFirestore();

const paystackSecret = defineSecret('PAYSTACK_SECRET_KEY');
const flutterwaveSecret = defineSecret('FLUTTERWAVE_SECRET_KEY');
const flutterwaveHash = defineSecret('FLUTTERWAVE_SECRET_HASH');
// Public URL of the deployed web app, e.g. https://your-project.web.app (no trailing slash).
const appUrl = defineString('APP_URL');

const PROVIDERS = ['paystack', 'flutterwave'];
const MAX_INITIALISATIONS_PER_10_MIN = 5;

const providerFetch = async (url, options = {}) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
};

const deps = () => ({ db, Timestamp, FieldValue });

/* ------------------------------------------------------------------ */
/* Provider verification (server -> provider; never trust the webhook  */
/* body for money values)                                              */
/* ------------------------------------------------------------------ */

const verifyWithPaystack = async (reference) => {
  const { ok, status, body } = await providerFetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${paystackSecret.value()}` } },
  );
  // Temporary provider errors (5xx or network issues) must throw standard Error so webhook returns 500
  if (status >= 500 || !status) {
    throw new Error(`Paystack temporary error (HTTP ${status || 'network'}). Retrying via webhook.`);
  }
  if (!ok && status !== 404 && status !== 400) {
    throw new Error(`Paystack API returned status ${status}: ${body?.message || 'Unknown error'}`);
  }
  if (!body?.status || !body?.data) {
    throw new PaymentRejectedError('verify-failed', body?.message || 'Paystack could not verify this transaction.');
  }
  const data = body.data;
  if (data.reference !== reference) {
    throw new PaymentRejectedError('reference-mismatch', 'Paystack returned a different reference.');
  }
  return {
    provider: 'paystack',
    reference,
    providerTransactionId: data.id,
    status: data.status === 'success' ? 'success' : data.status,
    amountMajor: fromMinorUnits(data.amount), // Paystack reports kobo
    currency: data.currency,
  };
};

const verifyWithFlutterwave = async (reference) => {
  const { ok, status, body } = await providerFetch(
    `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${flutterwaveSecret.value()}` } },
  );
  // Temporary provider errors (5xx or network issues) must throw standard Error so webhook returns 500
  if (status >= 500 || !status) {
    throw new Error(`Flutterwave temporary error (HTTP ${status || 'network'}). Retrying via webhook.`);
  }
  if (!ok && status !== 404 && status !== 400) {
    throw new Error(`Flutterwave API returned status ${status}: ${body?.message || 'Unknown error'}`);
  }
  if (body?.status !== 'success' || !body?.data) {
    throw new PaymentRejectedError('verify-failed', body?.message || 'Flutterwave could not verify this transaction.');
  }
  const data = body.data;
  if (data.tx_ref !== reference) {
    throw new PaymentRejectedError('reference-mismatch', 'Flutterwave returned a different tx_ref.');
  }
  return {
    provider: 'flutterwave',
    reference,
    providerTransactionId: data.id,
    status: data.status === 'successful' ? 'success' : data.status,
    amountMajor: Number(data.amount), // Flutterwave reports major units
    currency: data.currency,
  };
};

const verifyAndFulfil = async (provider, reference) => {
  const paid = provider === 'paystack' ? await verifyWithPaystack(reference) : await verifyWithFlutterwave(reference);
  return fulfilPayment(deps(), paid);
};

/** Webhook error policy: permanent rejections are logged + ACKed (no endless retries); transient errors -> 500. */
const handleWebhookError = async (response, error, provider, reference) => {
  if (error instanceof PaymentRejectedError) {
    console.warn(`[${provider}] payment rejected (${error.code}) ref=${reference}: ${error.message}`);
    await db.collection('payments').doc(`${provider}_${reference}_rejected_${Date.now()}`).set({
      provider,
      reference,
      status: 'rejected',
      reason: error.code,
      createdAt: FieldValue.serverTimestamp(),
    }).catch(() => {});
    response.status(200).send('rejected');
    return;
  }
  console.error(`[${provider}] webhook error ref=${reference}:`, error);
  response.status(500).send('error');
};

/* ------------------------------------------------------------------ */
/* 1. Server-side "initialize transaction"                             */
/*    The server alone decides price, currency, plan and metadata.     */
/* ------------------------------------------------------------------ */

exports.initializeTransaction = onCall(
  { secrets: [paystackSecret, flutterwaveSecret] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in to subscribe.');
    const { uid, token } = request.auth;
    const email = token.email;
    if (!email) throw new HttpsError('failed-precondition', 'Your account needs an email address to subscribe.');
    if (token.email_verified !== true) {
      throw new HttpsError('failed-precondition', 'Please verify your email address before subscribing.');
    }

    const provider = String(request.data?.provider || '').toLowerCase();
    if (!PROVIDERS.includes(provider)) throw new HttpsError('invalid-argument', 'Unsupported payment provider.');
    const plan = getPlan(request.data?.plan);
    if (!plan) throw new HttpsError('invalid-argument', 'Invalid plan selected.');

    // Basic abuse protection: cap checkout creation per user.
    const recent = await db.collection('pendingTransactions').where('uid', '==', uid).limit(25).get();
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    if (recent.docs.filter((d) => (d.data().createdAtMs || 0) > tenMinutesAgo).length >= MAX_INITIALISATIONS_PER_10_MIN) {
      throw new HttpsError('resource-exhausted', 'Too many checkout attempts. Please wait a few minutes.');
    }

    const reference = buildReference(uid);
    const callbackUrl = `${appUrl.value().replace(/\/$/, '')}/?payment=return&ref=${reference}#/plans`;

    // Persist the authoritative expectation BEFORE the customer can pay.
    await db.collection('pendingTransactions').doc(reference).set({
      uid,
      email,
      plan: plan.id,
      provider,
      amount: plan.amount,
      currency: plan.currency,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });

    try {
      if (provider === 'paystack') {
        const { ok, body } = await providerFetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: { Authorization: `Bearer ${paystackSecret.value()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            amount: toMinorUnits(plan.amount),
            currency: plan.currency,
            reference,
            callback_url: callbackUrl,
            metadata: { uid, plan: plan.id }, // informational only; fulfilment reads our own pending doc
          }),
        });
        if (!ok || !body.status) throw new Error(body.message || 'Paystack initialisation failed');
        return {
          provider,
          reference,
          checkoutUrl: body.data.authorization_url,
          accessCode: body.data.access_code,
          plan: plan.id,
          amount: plan.amount,
          currency: plan.currency,
        };
      }

      const { ok, body } = await providerFetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${flutterwaveSecret.value()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_ref: reference,
          amount: plan.amount,
          currency: plan.currency,
          redirect_url: callbackUrl,
          customer: { email, name: token.name || email.split('@')[0] },
          meta: { uid, plan: plan.id },
          customizations: { title: 'Solar Pulse', description: `${plan.name} plan (${plan.durationDays} days)` },
        }),
      });
      if (!ok || body.status !== 'success') throw new Error(body.message || 'Flutterwave initialisation failed');
      return { provider, reference, checkoutUrl: body.data.link, plan: plan.id, amount: plan.amount, currency: plan.currency };
    } catch (error) {
      console.error('initializeTransaction provider error:', error);
      await db.collection('pendingTransactions').doc(reference).update({ status: 'failed' }).catch(() => {});
      throw new HttpsError('unavailable', 'The payment provider is unavailable. Please try again shortly.');
    }
  },
);

/* ------------------------------------------------------------------ */
/* 2. Client-triggered verification after the redirect back to the app */
/*    (covers delayed / missed webhooks)                               */
/* ------------------------------------------------------------------ */

exports.verifyTransaction = onCall(
  { secrets: [paystackSecret, flutterwaveSecret] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in.');
    const reference = String(request.data?.reference || '');
    if (!isValidReference(reference)) throw new HttpsError('invalid-argument', 'Invalid payment reference.');

    const pendingSnap = await db.collection('pendingTransactions').doc(reference).get();
    if (!pendingSnap.exists || pendingSnap.data().uid !== request.auth.uid) {
      throw new HttpsError('not-found', 'Payment reference not found for your account.');
    }
    const pending = pendingSnap.data();
    if (pending.status === 'fulfilled') return { status: 'active', plan: pending.plan };

    try {
      const result = await verifyAndFulfil(pending.provider, reference);
      return { status: 'active', plan: result.plan };
    } catch (error) {
      if (error instanceof PaymentRejectedError) {
        // "not-successful" simply means the customer has not (yet) completed payment.
        return { status: error.code === 'not-successful' ? 'pending' : 'rejected', reason: error.code };
      }
      console.error('verifyTransaction error:', error);
      throw new HttpsError('internal', 'Could not verify the payment right now. Please try again.');
    }
  },
);

/* ------------------------------------------------------------------ */
/* 3. Webhooks (signature -> re-verify with provider -> fulfil once)   */
/* ------------------------------------------------------------------ */

exports.paystackWebhook = onRequest({ secrets: [paystackSecret] }, async (request, response) => {
  if (request.method !== 'POST') {
    response.status(405).send('Method not allowed');
    return;
  }
  if (!verifyPaystackSignature(request.rawBody, request.get('x-paystack-signature'), paystackSecret.value())) {
    response.status(401).send('Invalid signature');
    return;
  }

  const event = request.body || {};
  const reference = event.data?.reference || event.data?.transaction_reference;
  try {
    if (event.event === 'charge.success') {
      if (!isValidReference(reference)) {
        response.status(200).send('ignored'); // not one of ours
        return;
      }
      await verifyAndFulfil('paystack', reference);
    } else if (event.event === 'refund.processed') {
      await revokeForReference('paystack', event.data?.transaction_reference, 'refunded');
    }
    response.status(200).send('ok');
  } catch (error) {
    await handleWebhookError(response, error, 'paystack', reference);
  }
});

exports.flutterwaveWebhook = onRequest({ secrets: [flutterwaveSecret, flutterwaveHash] }, async (request, response) => {
  if (request.method !== 'POST') {
    response.status(405).send('Method not allowed');
    return;
  }
  if (!verifyFlutterwaveHash(request.get('verif-hash'), flutterwaveHash.value())) {
    response.status(401).send('Invalid signature');
    return;
  }

  const event = request.body || {};
  const reference = event.data?.tx_ref;
  try {
    if (event.event === 'charge.completed' && event.data?.status === 'successful') {
      if (!isValidReference(reference)) {
        response.status(200).send('ignored');
        return;
      }
      await verifyAndFulfil('flutterwave', reference);
    }
    response.status(200).send('ok');
  } catch (error) {
    await handleWebhookError(response, error, 'flutterwave', reference);
  }
});

/** Refund handling: revoke the subscription if it was granted by the refunded payment. */
const revokeForReference = async (provider, reference, status) => {
  if (!isValidReference(reference)) return;
  const pendingSnap = await db.collection('pendingTransactions').doc(reference).get();
  if (!pendingSnap.exists) return;
  const { uid } = pendingSnap.data();
  const subRef = db.collection('subscriptions').doc(uid);
  const subSnap = await subRef.get();
  if (subSnap.exists && subSnap.data().providerReference === reference) {
    await subRef.update({ status, updatedAt: FieldValue.serverTimestamp() });
  }
  await db.collection('payments').doc(`${provider}_${reference}`).set({ status }, { merge: true });
};

/* ------------------------------------------------------------------ */
/* 4. Expiry sweep. Gating already checks expiresAt on the client and  */
/*    in Firestore rules; this keeps stored status honest for admin.   */
/* ------------------------------------------------------------------ */

exports.expireSubscriptions = onSchedule('every 24 hours', async () => {
  const expired = await db.collection('subscriptions').where('expiresAt', '<', Timestamp.now()).get();
  const batch = db.batch();
  let count = 0;
  expired.forEach((snap) => {
    if (snap.data().status === 'active') {
      batch.update(snap.ref, { status: 'expired', updatedAt: FieldValue.serverTimestamp() });
      count += 1;
    }
  });
  if (count > 0) await batch.commit();
  console.log(`Expired ${count} subscription(s).`);
});

/* ------------------------------------------------------------------ */
/* 5. Account deletion (App Store / Google Play / NDPR / GDPR)         */
/* ------------------------------------------------------------------ */

exports.deleteMyData = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in.');
  const { uid, token } = request.auth;

  // 1. Recursive delete user document, projects subcollections, and profile avatar
  await db.recursiveDelete(db.collection('users').doc(uid)).catch(() => {});
  // 2. Delete user's presence record
  await db.collection('presence').doc(uid).delete().catch(() => {});
  // 3. Delete user's subscription record
  await db.collection('subscriptions').doc(uid).delete().catch(() => {});

  const deleteByField = async (collectionName, field, value) => {
    if (!value) return;
    const snap = await db.collection(collectionName).where(field, '==', value).get();
    const batch = db.batch();
    snap.forEach((d) => batch.delete(d.ref));
    if (!snap.empty) await batch.commit();
  };

  await deleteByField('pendingTransactions', 'uid', uid);
  await deleteByField('supportTickets', 'userId', uid);
  if (token?.email) {
    await deleteByField('supportTickets', 'email', token.email);
  }
  // `payments` ledger entries are retained (financial-records obligation) but hold no email/name.

  return { deleted: true };
});

