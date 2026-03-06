import { getOpenSkyToken } from '../../lib/opensky';

export async function GET() {
    try {
        const now = new Date();
        const currentUnix = Math.floor(now.getTime() / 1000);

        // Go back exactly 2 days, rounded to the nearest hour (3600s) to allow fetch caching
        const end = (currentUnix - (currentUnix % 3600)) - (48 * 60 * 60);
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
        const flightList = Array.isArray(data) ? data : [];

        // Parse data to extract meaningful metrics
        const totalArrivals = flightList.length || 0;

        const domestic = flightList.filter(f => f.estDepartureAirport && f.estDepartureAirport.startsWith('K')).length;
        const international = totalArrivals - domestic;

        return Response.json({
            data: {
                totalArrivals,
                domestic,
                international,
                rawCount: totalArrivals,
                flights: flightList.slice(0, 100).map(f => ({
                    callsign: f.callsign?.trim() || 'UNKNOWN',
                    origin: f.estDepartureAirport || 'N/A',
                    firstSeen: f.firstSeen,
                    lastSeen: f.lastSeen
                })),
                timeframe: { begin, end }
            }
        });

    } catch (error) {
        console.error("Flight API Error:", error);
        return Response.json({ error: "Failed to fetch flight data" }, { status: 500 });
    }
}
