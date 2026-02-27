// Amadeus API requires an OAuth2 Bearer token which expires every 30 minutes.
// This function handles fetching/caching that token.
let cachedToken = null;
let tokenExpiration = 0;

async function getAmadeusToken() {
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Missing AMADEUS_CLIENT_ID or AMADEUS_CLIENT_SECRET in .env.local");
    }

    if (cachedToken && Date.now() < tokenExpiration) {
        return cachedToken;
    }

    const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
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
        throw new Error("Failed to fetch Amadeus token");
    }

    const data = await response.json();
    cachedToken = data.access_token;
    // Subtracting 60 seconds from expiration for safety margin
    tokenExpiration = Date.now() + (data.expires_in - 60) * 1000;

    return cachedToken;
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const checkIn = searchParams.get('checkIn');
        const checkOut = searchParams.get('checkOut');

        if (!checkIn || !checkOut) {
            return Response.json({ error: "Missing checkIn or checkOut parameters" }, { status: 400 });
        }

        // Attempt to get token (will fail if .env vars are missing, which is expected before setup)
        let token;
        try {
            token = await getAmadeusToken();
        } catch (authError) {
            // If no credentials, return a mock response with a flag so the UI can prompt the user
            return Response.json({
                requiresAuth: true,
                message: "Add AMADEUS_CLIENT_ID to .env.local for live data",
                // Fallback mock data to keep UI functional during setup
                data: {
                    averagePrice: 489,
                    compressionScore: 88,
                    status: "High Compression"
                }
            });
        }

        // LAS city code for Amadeus is LAS
        // To get pricing, we use the Hotel Search API v3
        // For simplicity in this POC, we'll query properties by city code.
        const url = new URL("https://test.api.amadeus.com/v3/shopping/hotel-offers");
        url.searchParams.append("cityCode", "LAS");
        url.searchParams.append("checkInDate", checkIn);
        url.searchParams.append("checkOutDate", checkOut);
        url.searchParams.append("roomQuantity", "1");
        url.searchParams.append("adults", "2"); // Standard query
        // url.searchParams.append("radius", "5"); // Strip radius

        const hotelResponse = await fetch(url.toString(), {
            headers: {
                "Authorization": `Bearer ${token}`
            },
            next: { revalidate: 3600 } // Cache for 1 hour to stay within free limits
        });

        if (!hotelResponse.ok) {
            console.error("Amadeus API error:", await hotelResponse.text());
            return Response.json({
                requiresAuth: true,
                message: "Amadeus rate limit or upstream error. Falling back to test payload.",
                data: {
                    averagePrice: 489,
                    compressionScore: 88,
                    status: "High Compression"
                }
            }, { status: 200 });
        }

        const hotelData = await hotelResponse.json();

        // Calculate Compression metrics based on real pricing
        const offers = hotelData.data || [];

        // If no offers, compression is 100 (sold out)
        if (offers.length === 0) {
            return Response.json({
                data: {
                    averagePrice: null,
                    compressionScore: 100,
                    status: "Peak Saturation / Sold Out"
                }
            });
        }

        // Calculate average base price across available Strip hotels
        let totalPrice = 0;
        let validOffers = 0;

        offers.forEach(hotel => {
            const offer = hotel.offers && hotel.offers[0];
            if (offer && offer.price && offer.price.base) {
                totalPrice += parseFloat(offer.price.base);
                validOffers++;
            }
        });

        const averagePrice = validOffers > 0 ? (totalPrice / validOffers) : 0;

        // Extremely rudimentary index (0-100) based purely on testing test-environment data
        // Assuming a "baseline" average Strip room in the test env is ~$150.
        // > $400 is considered massive compression (90+)
        let compressionScore = 50; // default neutral
        if (averagePrice > 0) {
            // baseline 150 -> 50 score
            // every $10 above baseline adds 1 to the score, up to 100
            const delta = Math.max(0, averagePrice - 150);
            compressionScore = Math.min(100, Math.round(50 + (delta / 5)));
        }

        let status = "Neutral Growth";
        if (compressionScore > 85) status = "Peak Saturation";
        else if (compressionScore > 60) status = "High Compression";
        else if (compressionScore < 30) status = "Contraction";

        return Response.json({
            data: {
                averagePrice: Math.round(averagePrice),
                compressionScore,
                status
            }
        });

    } catch (error) {
        console.error("Hotel API Error:", error);
        return Response.json({
            requiresAuth: true,
            message: "Failed to process hotel data. Falling back to test payload.",
            data: {
                averagePrice: 489,
                compressionScore: 88,
                status: "High Compression"
            }
        }, { status: 200 });
    }
}
