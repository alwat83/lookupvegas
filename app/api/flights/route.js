import { getOpenSkyToken } from '../../lib/opensky';

export async function GET() {
    try {
        const now = new Date();
        // Go back exactly 2 days to ensure the batch process has completed for that 24h period.
        const end = Math.floor(now.setDate(now.getDate() - 2) / 1000);
        const begin = end - (24 * 60 * 60); // 24 hours prior

        const token = await getOpenSkyToken();
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};

        const response = await fetch(
            `https://opensky-network.org/api/flights/arrival?airport=KLAS&begin=${begin}&end=${end}`,
            {
                headers,
                next: { revalidate: 3600 }, // Cache for 1 hour
            }
        );

        if (!response.ok) {
            return Response.json(
                {
                    error: "OpenSky rate limit or unavailability",
                    data: { totalArrivals: 0, international: 0, domestic: 0, rawCount: 0 }
                },
                { status: 200 }
            );
        }

        const data = await response.json();

        // Parse data to extract meaningful metrics
        const totalArrivals = data.length || 0;

        const domestic = data.filter(f => f.estDepartureAirport && f.estDepartureAirport.startsWith('K')).length;
        const international = totalArrivals - domestic;

        return Response.json({
            data: {
                totalArrivals,
                domestic,
                international,
                rawCount: totalArrivals,
                timeframe: { begin, end }
            }
        });

    } catch (error) {
        console.error("Flight API Error:", error);
        return Response.json({ error: "Failed to fetch flight data" }, { status: 500 });
    }
}
