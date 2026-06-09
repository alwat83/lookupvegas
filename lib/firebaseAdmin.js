import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initFirebaseAdmin() {
    if (!getApps().length) {
        try {
            // This works automatically in Firebase App Hosting (Cloud Run)
            // It will use Application Default Credentials
            initializeApp();
            console.log('Firebase Admin Initialized Successfully.');
        } catch (error) {
            console.warn('Firebase Admin init failed (If running locally, ensure GOOGLE_APPLICATION_CREDENTIALS is set or fallback to mock data).', error.message);
        }
    }
}

initFirebaseAdmin();

export const db = getFirestore();
