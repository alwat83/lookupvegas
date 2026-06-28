import { Unkey } from "@unkey/api";

const unkey = new Unkey({ rootKey: process.env.UNKEY_ROOT_KEY });

export const verifyUnkeyToken = async (token) => {
    try {
        const { result, error } = await unkey.keys.verify({
            apiId: process.env.UNKEY_API_ID,
            key: token,
        });

        if (error) {
            console.error("Unkey Verification Error:", error.message);
            return { valid: false, error: error.message };
        }

        if (!result.valid) {
            return { valid: false, error: "Invalid or revoked API key" };
        }

        return { 
            valid: true, 
            ownerId: result.ownerId, 
            meta: result.meta 
        };
    } catch (e) {
        console.error("Unkey exception:", e);
        return { valid: false, error: "Internal Unkey Error" };
    }
};

export const createUnkeyToken = async (userId, name) => {
    try {
        const { result, error } = await unkey.keys.create({
            apiId: process.env.UNKEY_API_ID,
            prefix: "lkv",
            ownerId: userId,
            name: name || "LookupVegas Enterprise Key",
            meta: {
                tier: "Enterprise"
            }
        });

        if (error) {
            console.error("Unkey Create Error:", error.message);
            return { success: false, error: error.message };
        }

        return { success: true, key: result.key, keyId: result.keyId };
    } catch (e) {
        console.error("Unkey exception:", e);
        return { success: false, error: "Internal Unkey Error" };
    }
};

export const revokeUnkeyToken = async (keyId) => {
    try {
        const { error } = await unkey.keys.delete({ keyId });
        if (error) {
            console.error("Unkey Revoke Error:", error.message);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (e) {
        console.error("Unkey exception:", e);
        return { success: false, error: "Internal Unkey Error" };
    }
};

export const listUnkeyTokens = async (userId) => {
    // Unkey API allows listing keys by ownerId
    try {
        // Because the Node SDK doesn't natively expose list by ownerId via `unkey.keys.list`, 
        // we use the HTTP API directly or check if the SDK supports it.
        // As of recent SDK versions, we can use fetch against api.unkey.dev
        const response = await fetch(`https://api.unkey.dev/v1/apis/${process.env.UNKEY_API_ID}/keys?ownerId=${userId}`, {
            headers: {
                Authorization: `Bearer ${process.env.UNKEY_ROOT_KEY}`
            }
        });
        
        if (!response.ok) {
            const txt = await response.text();
            throw new Error(txt);
        }

        const data = await response.json();
        return { success: true, keys: data.keys || [] };
    } catch (e) {
        console.error("Unkey List Error:", e);
        return { success: false, error: e.message };
    }
};
