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

        // Dynamic heuristic: US ICAO hex codes start with 'A' (A00000 - AFFFFF)
        let domestic = 0;
        let international = 0;

        flightList.forEach(f => {
            if (f.hex && f.hex.toLowerCase().startsWith('a')) {
                domestic++;
            } else {
                international++;
            }
        });

        // In the extremely rare case ADSB returns zero data but we know planes are landing,
        // we could add a minor baseline, but for a live dashboard true zero is better.
        
        return Response.json({
            data: {
                totalArrivals,
                domestic,
                international,
                rawCount: totalArrivals,
                flights: flightList.slice(0, 100).map(f => ({
                    callsign: f.flight?.trim() || 'UNKNOWN',
                    origin: f.hex?.toLowerCase().startsWith('a') ? 'Domestic (US)' : 'International',
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
