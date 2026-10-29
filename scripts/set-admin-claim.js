#!/usr/bin/env node
/**
 * Solar Pulse – Custom Claims Management Script
 * ─────────────────────────────────────────────
 * Usage:
 *   node scripts/set-admin-claim.js <user-email-or-uid> [--revoke]
 *
 * Requirements:
 *   - GOOGLE_APPLICATION_CREDENTIALS pointing to service account key, OR
 *   - Logged in with Firebase CLI (`firebase login`)
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const target = process.argv[2];
const isRevoke = process.argv.includes('--revoke');

if (!target) {
  console.error('Usage: node scripts/set-admin-claim.js <user-email-or-uid> [--revoke]');
  process.exit(1);
}

try {
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'solar-pulse1'
  });
} catch (_) {}

const auth = getAuth();

async function setAdmin() {
  let user;
  try {
    if (target.includes('@')) {
      user = await auth.getUserByEmail(target.toLowerCase());
    } else {
      user = await auth.getUser(target);
    }
  } catch (err) {
    console.error(`User not found for "${target}":`, err.message);
    process.exit(1);
  }

  const existingClaims = user.customClaims || {};
  const newClaims = { ...existingClaims };

  if (isRevoke) {
    delete newClaims.admin;
    await auth.setCustomUserClaims(user.uid, newClaims);
    console.log(`[OK] Revoked admin claim from ${user.email} (${user.uid}).`);
  } else {
    newClaims.admin = true;
    await auth.setCustomUserClaims(user.uid, newClaims);
    console.log(`[OK] Successfully granted { admin: true } to ${user.email} (${user.uid}).`);
  }
}

setAdmin().catch((err) => {
  console.error('Error setting custom claims:', err);
  process.exit(1);
});
