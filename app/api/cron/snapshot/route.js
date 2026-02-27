import { sql } from '@vercel/postgres';
import { getOpenSkyToken } from '../../../lib/opensky';

export async function GET(request) {
    try {
        // 1. Secure the Cron Job Endpoint
        const authHeader = request.headers.get('authorization');
        if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch OpenSky Flight Data (Yesterday's Trailing Volume)
        const now = new Date();
        const end = Math.floor(now.setDate(now.getDate() - 1) / 1000);
        const begin = end - (24 * 60 * 60);

        const openSkyToken = await getOpenSkyToken();
        const osHeaders = openSkyToken ? { "Authorization": `Bearer ${openSkyToken}` } : {};

        const flightRes = await fetch(
            `https://opensky-network.org/api/flights/arrival?airport=KLAS&begin=${begin}&end=${end}`,
            { headers: osHeaders }
        );

        let totalArrivals = 0;
        if (flightRes.ok) {
            const flightData = await flightRes.json();
            totalArrivals = flightData.length || 0;
        }

        // 3. Fetch Amadeus Hotel Compression (Next Weekend)
        let compressionScore = 50.0; // Default Neutral
        const amadeusBase64 = Buffer.from(`${process.env.AMADEUS_CLIENT_ID}:${process.env.AMADEUS_CLIENT_SECRET}`).toString("base64");

        // Quick Auth
        const amadeusAuth = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${amadeusBase64}`
            },
            body: "grant_type=client_credentials"
        });

        if (amadeusAuth.ok) {
            const { access_token } = await amadeusAuth.json();

            // Find next Friday
            const targetDate = new Date();
            const dayOfWeek = targetDate.getDay();
            const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
            targetDate.setDate(targetDate.getDate() + daysUntilFriday);
            const checkIn = targetDate.toISOString().split('T')[0];

            const hotelRes = await fetch(`https://test.api.amadeus.com/v3/shopping/hotel-offers?cityCode=LAS&checkInDate=${checkIn}&adults=2`, {
                headers: { "Authorization": `Bearer ${access_token}` }
            });

            if (hotelRes.ok) {
                const hData = await hotelRes.json();
                if (hData.data && hData.data.length > 0) {
                    const totalRate = hData.data.reduce((sum, hotel) => {
                        const price = hotel.offers?.[0]?.price?.total || 0;
                        return sum + parseFloat(price);
                    }, 0);
                    const avgRate = totalRate / hData.data.length;
                    // Dummy heuristic for score
                    compressionScore = Math.min(Math.max((avgRate / 250) * 50, 0), 100);
                }
            }
        }

        // 4. Calculate City Velocity Index
        // (Weighted composite: Flights 60%, Hotels 40%. Baseline flights ~450)
        const flightVelocity = Math.min((totalArrivals / 450) * 50, 100);
        const cityVelocityIndex = (flightVelocity * 0.6) + (compressionScore * 0.4);

        // 5. Insert Snapshot into Vercel Postgres
        const snapshotDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const dbResult = await sql`
        INSERT INTO daily_metrics (date, flight_arrivals_total, hotel_compression_score, city_velocity_index)
        VALUES (${snapshotDate}, ${totalArrivals}, ${compressionScore}, ${cityVelocityIndex})
        ON CONFLICT (date) 
        DO UPDATE SET 
            flight_arrivals_total = EXCLUDED.flight_arrivals_total,
            hotel_compression_score = EXCLUDED.hotel_compression_score,
            city_velocity_index = EXCLUDED.city_velocity_index;
    `;

        return Response.json({
            message: "Snapshot successful",
            data: { date: snapshotDate, arrivals: totalArrivals, compression: compressionScore, velocity: cityVelocityIndex }
        }, { status: 200 });

    } catch (error) {
        console.error("Cron Snapshot Error:", error);
        return Response.json({ error: "Failed to execute daily snapshot" }, { status: 500 });
    }
}
