import { getUserProfile } from '../../../../lib/authMiddleware';
import { createUnkeyToken, listUnkeyTokens, revokeUnkeyToken } from '../../../../lib/unkey';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { tier, isPremium, userId, error } = await getUserProfile(req);

        if (error || !userId || tier !== 'Enterprise') {
            return Response.json({ error: 'Unauthorized. Enterprise access required.' }, { status: 401 });
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

        if (error || !userId || tier !== 'Enterprise') {
            return Response.json({ error: 'Unauthorized. Enterprise access required.' }, { status: 401 });
        }

        let body = {};
        try {
            body = await req.json();
        } catch(e) {}

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

        if (error || !userId || tier !== 'Enterprise') {
            return Response.json({ error: 'Unauthorized. Enterprise access required.' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const keyId = searchParams.get('keyId');

        if (!keyId) {
            return Response.json({ error: 'keyId is required' }, { status: 400 });
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
