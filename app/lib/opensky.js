let cachedToken = null;
let tokenExpiration = 0;

export async function getOpenSkyToken() {
    const clientId = process.env.OPENSKY_CLIENT_ID;
    const clientSecret = process.env.OPENSKY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return null; // Fallback to unauthenticated if no creds are present
    }

    if (cachedToken && Date.now() < tokenExpiration) {
        return cachedToken;
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

    if (!response.ok) {
        console.error("Failed to fetch OpenSky token:", await response.text());
        return null;
    }

    const data = await response.json();
    cachedToken = data.access_token;
    // Tokens are usually 30min, we cache for expiration minus 1 minute buffer
    tokenExpiration = Date.now() + (data.expires_in - 60) * 1000;

    return cachedToken;
}
