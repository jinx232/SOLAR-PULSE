const crypto = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

initializeApp();
const db = getFirestore();

const paystackSecret = defineSecret('PAYSTACK_SECRET_KEY');
const flutterwaveSecret = defineSecret('FLUTTERWAVE_SECRET_KEY');
const flutterwaveHash = defineSecret('FLUTTERWAVE_SECRET_HASH');

const readFlutterwaveMeta = (meta, name) => {
  const item = Array.isArray(meta) ? meta.find((entry) => entry.metaname === name) : null;
  return item?.metavalue || '';
};

const saveSubscription = async ({ userId, email, plan, provider, providerReference, amount, currency }) => {
  if (!userId || !['pro', 'installer'].includes(plan)) {
    throw new Error('Missing or invalid subscription metadata.');
  }

  await db.collection('subscriptions').doc(userId).set({
    email: email || '',
    plan,
    status: 'active',
    provider,
    providerReference: providerReference || '',
    amount: Number(amount || 0),
    currency: currency || 'NGN',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
};

exports.paystackWebhook = onRequest({ secrets: [paystackSecret] }, async (request, response) => {
  const signature = request.get('x-paystack-signature');
  const expected = crypto.createHmac('sha512', paystackSecret.value()).update(request.rawBody).digest('hex');
  const signatureBuffer = Buffer.from(signature || '');
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    response.status(401).send('Invalid signature');
    return;
  }

  try {
    const event = request.body;
    if (event.event === 'charge.success') {
      const metadata = event.data?.metadata || {};
      await saveSubscription({
        userId: metadata.userId,
        email: event.data?.customer?.email,
        plan: metadata.plan,
        provider: 'paystack',
        providerReference: event.data?.reference,
        amount: event.data?.amount,
        currency: event.data?.currency,
      });
    }
    response.status(200).send('ok');
  } catch (error) {
    console.error('Paystack webhook error:', error);
    response.status(400).send(error.message);
  }
});

exports.flutterwaveWebhook = onRequest({ secrets: [flutterwaveSecret, flutterwaveHash] }, async (request, response) => {
  const signature = request.get('verif-hash');
  if (!signature || signature !== flutterwaveHash.value()) {
    response.status(401).send('Invalid signature');
    return;
  }

  try {
    const event = request.body;
    if (event.event === 'charge.completed' && event.data?.status === 'successful') {
      const metadata = event.data?.meta || [];
      const verifyResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${event.data.id}/verify`, {
        headers: { Authorization: `Bearer ${flutterwaveSecret.value()}` },
      });
      const verified = await verifyResponse.json();
      if (!verifyResponse.ok || verified.data?.status !== 'successful' || verified.data?.id !== event.data.id) {
        throw new Error('Flutterwave transaction verification failed.');
      }

      await saveSubscription({
        userId: readFlutterwaveMeta(metadata, 'userId'),
        email: event.data?.customer?.email,
        plan: readFlutterwaveMeta(metadata, 'plan'),
        provider: 'flutterwave',
        providerReference: event.data?.tx_ref,
        amount: event.data?.amount,
        currency: event.data?.currency,
      });
    }
    response.status(200).send('ok');
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    response.status(400).send(error.message);
  }
});
