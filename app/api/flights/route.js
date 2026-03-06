import { getOpenSkyToken } from '../../lib/opensky';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const response = await fetch(
            `https://api.adsb.lol/v2/lat/36.0840/lon/-115.1537/dist/250`,
            {
                next: { revalidate: 60 }, // Cache for 1 minute
            }
        );

        if (!response.ok) {
            return Response.json(
                {
                    error: "ADSB limit or unavailability",
                    data: { totalArrivals: 0, international: 0, domestic: 0, rawCount: 0 }
                },
                { status: 200 }
            );
        }

        const data = await response.json();

        // Find planes that are descending into the area
        const flightList = (data.ac || []).filter(state =>
            state.flight && state.alt_baro < 25000 && state.baro_rate < -100
        );

        const totalArrivals = flightList.length || 0;

        // Mocking the domestic/international split for live telemetry
        const domestic = Math.floor(totalArrivals * 0.85);
        const international = totalArrivals - domestic;

        return Response.json({
            data: {
                totalArrivals,
                domestic,
                international,
                rawCount: totalArrivals,
                flights: flightList.slice(0, 100).map(f => ({
                    callsign: f.flight?.trim() || 'UNKNOWN',
                    origin: 'UNKNOWN',
                    firstSeen: Math.floor(Date.now() / 1000) - 1800,
                    lastSeen: Math.floor(Date.now() / 1000)
                })),
                timeframe: { begin: Math.floor(Date.now() / 1000) - 3600, end: Math.floor(Date.now() / 1000) }
            }
        });

    } catch (error) {
        console.error("Flight API Error:", error);
        return Response.json({ error: "Failed to fetch flight data" }, { status: 500 });
    }
}
