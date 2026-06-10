import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initFirebaseAdmin() {
    if (!getApps().length) {
        try {
            initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'lookupvegas-337b3'
            });
            console.log('Firebase Admin Initialized Successfully.');
        } catch (error) {
            console.warn('Firebase Admin init failed (If running locally, ensure GOOGLE_APPLICATION_CREDENTIALS is set or fallback to mock data).', error.message);
        }
    }
}

initFirebaseAdmin();

export const db = getFirestore();
