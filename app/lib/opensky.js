let cachedToken = null;
let tokenExpiration = 0;

export async function getOpenSkyToken() {
    const username = process.env.OPENSKY_USERNAME;
    const password = process.env.OPENSKY_PASSWORD;
    const clientId = process.env.OPENSKY_CLIENT_ID;
    const clientSecret = process.env.OPENSKY_CLIENT_SECRET;

    // 1. If we have native OAuth2 Client Credentials (Enterprise)
    if (clientId && clientSecret) {
        if (cachedToken && Date.now() < tokenExpiration) {
            return `Bearer ${cachedToken}`;
        }

        const response = await fetch("https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                client_id: clientId,
                client_secret: clientSecret,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            cachedToken = data.access_token;
            tokenExpiration = Date.now() + (data.expires_in - 60) * 1000;
            return `Bearer ${cachedToken}`;
        }
    }

    // 2. If we have standard website credentials (HTTP Basic Auth)
    if (username && password) {
        // HTTP Basic encoding: base64(username:password)
        const encoded = Buffer.from(`${username}:${password}`).toString('base64');
        return `Basic ${encoded}`;
    }

    // 3. Fallback to unauthenticated (rate-limited)
    return null;
}
