import { getUserProfile } from '../../../../lib/authMiddleware';
import { createUnkeyToken, listUnkeyTokens, revokeUnkeyToken } from '../../../../lib/unkey';

export const dynamic = 'force-dynamic';

// In-memory mock state for prototype UI if Unkey is not configured
let mockApiKeys = [];

export async function GET(req) {
    try {
        const { tier, isPremium, userId, error } = await getUserProfile(req);

        // Allow unlocked bypass for prototype
        const isUnlocked = req.headers.get('referer')?.includes('unlocked=true');
        if (error || !userId || (tier !== 'Enterprise' && !isUnlocked)) {
            return Response.json({ error: 'Unauthorized. Enterprise access required.' }, { status: 401 });
        }

        if (!process.env.UNKEY_ROOT_KEY) {
            return Response.json({ keys: mockApiKeys });
        }

        const result = await listUnkeyTokens(userId);
        if (!result.success) {
            return Response.json({ error: result.error }, { status: 500 });
        }

        return Response.json({ keys: result.keys });
    } catch (error) {
        console.error("GET Unkey Error:", error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { tier, isPremium, userId, error } = await getUserProfile(req);

        const isUnlocked = req.headers.get('referer')?.includes('unlocked=true');
        if (error || !userId || (tier !== 'Enterprise' && !isUnlocked)) {
            return Response.json({ error: 'Unauthorized. Enterprise access required.' }, { status: 401 });
        }

        let body = {};
        try {
            body = await req.json();
        } catch(e) {}

        if (!process.env.UNKEY_ROOT_KEY) {
            const newKey = {
                id: 'key_' + Math.random().toString(36).substring(2, 9),
                key: 'lkv_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                name: body.name || "Enterprise Analytics Key",
                createdAt: Date.now()
            };
            // Prepend so newest is first
            mockApiKeys = [newKey, ...mockApiKeys];
            return Response.json({ key: newKey.key, keyId: newKey.id });
        }

        const result = await createUnkeyToken(userId, body.name || "Enterprise Analytics Key");
        
        if (!result.success) {
            return Response.json({ error: result.error }, { status: 500 });
        }

        return Response.json({ key: result.key, keyId: result.keyId });
    } catch (error) {
        console.error("POST Unkey Error:", error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { tier, isPremium, userId, error } = await getUserProfile(req);

        const isUnlocked = req.headers.get('referer')?.includes('unlocked=true');
        if (error || !userId || (tier !== 'Enterprise' && !isUnlocked)) {
            return Response.json({ error: 'Unauthorized. Enterprise access required.' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const keyId = searchParams.get('keyId');

        if (!keyId) {
            return Response.json({ error: 'keyId is required' }, { status: 400 });
        }

        if (!process.env.UNKEY_ROOT_KEY) {
            mockApiKeys = mockApiKeys.filter(k => k.id !== keyId);
            return Response.json({ success: true });
        }

        const result = await revokeUnkeyToken(keyId);
        
        if (!result.success) {
            return Response.json({ error: result.error }, { status: 500 });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error("DELETE Unkey Error:", error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
