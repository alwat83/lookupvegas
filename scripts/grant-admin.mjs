// One-time operational script: grants Enterprise tier + admin flag to a real
// user in Firestore. Required because the hardcoded email bypass in
// lib/authMiddleware.js and app/contexts/AuthContext.js was removed -- admin
// status now lives only on the user's Firestore document, and this account
// never had that document field set (the hardcode was standing in for it).
//
// This is a standalone Node script, not a Next.js module, so it initializes
// firebase-admin directly rather than importing lib/firebaseAdmin.js (which
// uses ESM import syntax without "type": "module" in package.json --
// resolvable inside Next's bundler, not under plain `node`).
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
//     node scripts/grant-admin.mjs someone@example.com

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/grant-admin.mjs <email>');
  process.exit(1);
}

initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'lookupvegas-337b3',
});

const auth = getAuth();
const db = getFirestore();

const user = await auth.getUserByEmail(email);

await db.collection('users').doc(user.uid).set(
  { tier: 'Enterprise', isAdmin: true },
  { merge: true }
);

console.log(`Granted Enterprise tier + isAdmin to ${email} (uid: ${user.uid})`);
