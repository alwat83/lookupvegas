import { getOpenSkyToken } from '../../lib/opensky';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch 50 miles around Las Vegas (KLAS)
        const response = await fetch(
            `https://api.adsb.lol/v2/lat/36.0840/lon/-115.1537/dist/50`,
            {
                next: { revalidate: 10 }, // 10s cache
            }
        );

        if (!response.ok) {
            const bodyTxt = await response.text();
            return Response.json({ error: `Upstream HTTP ${response.status}: ${bodyTxt}`, data: [] }, { status: 200 });
        }

        const data = await response.json();

        // ADSB.lol returns { ac: [...] }
        const activeFlights = (data.ac || []).map(state => ({
            icao: state.hex,
            callsign: state.flight ? state.flight.trim() : 'UNKNOWN',
            country: 'Tracking', // ADSB.lol omits country DB by default
            longitude: state.lon,
            latitude: state.lat,
            altitude: state.alt_baro ? state.alt_baro : 0, // native feet from ADSB.lol
            velocity: state.gs ? state.gs : 0, // native kts from ADSB.lol
            heading: state.track || state.dir || 0
        })).filter(f => f.longitude && f.latitude);

        return Response.json({
            data: activeFlights
        });

    } catch (error) {
        console.error("Radar API Error:", error);
        return Response.json({ error: String(error) + " | " + String(error.cause || ""), stack: error.stack, data: [] }, { status: 200 });
    }
}
