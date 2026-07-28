import { getAuth } from 'firebase-admin/auth';
import { db } from './firebaseAdmin';

export async function getUserProfile(req) {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { tier: 'Free', isPremium: false, error: 'No token provided' };
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (idToken.startsWith('lkv_') || idToken.startsWith('key_')) {
        const { verifyUnkeyToken } = await import('./unkey');
        const unkeyResult = await verifyUnkeyToken(idToken);
        
        if (unkeyResult.valid) {
            // Unkey verified successfully. Assume Enterprise privileges since only Enterprise users can generate these keys.
            return { tier: 'Enterprise', isPremium: true, userId: unkeyResult.ownerId, isApi: true };
        } else {
            return { tier: 'Free', isPremium: false, error: 'Invalid API Key' };
        }
    }

    try {
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return { tier: 'Free', isPremium: false, error: 'User profile not found' };
        }

        const data = userDoc.data();
        const tier = data.tier || 'Free';
        const isPremium = tier === 'Intelligence' || tier === 'Enterprise';
        const isAdmin = data.isAdmin === true;

        return { tier, isPremium, userId, isAdmin };
    } catch (error) {
        console.error('Error verifying auth token:', error);
        return { tier: 'Free', isPremium: false, error: 'Invalid token' };
    }
}
