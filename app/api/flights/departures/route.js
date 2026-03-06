import { getOpenSkyToken } from '../../../lib/opensky';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch 50 miles around Las Vegas (KLAS)
        const response = await fetch(
            `https://api.adsb.lol/v2/lat/36.0840/lon/-115.1537/dist/50`,
            {
                next: { revalidate: 30 }, // Cache for 30s
            }
        );

        if (!response.ok) {
            return Response.json({ error: "ADSB rate limit or unavailability", data: [] }, { status: 200 });
        }

        const data = await response.json();

        // Find planes that are climbing (Outbound/Departures)
        const outboundFlights = (data.ac || []).filter(state =>
            state.flight && state.alt_baro < 20000 && state.baro_rate > 200
        ).map(state => ({
            icao24: state.hex,
            callsign: state.flight.trim(),
            origin: 'KLAS',
            destination: 'UNKNOWN', // Live telemetry lacks destinations natively
            firstSeen: Math.floor(Date.now() / 1000), // mock duration for UI
            lastSeen: Math.floor(Date.now() / 1000) + 1800,
            status: 'Departing'
        })).sort((a, b) => b.firstSeen - a.firstSeen); // Match legacy UI sort

        return Response.json({ data: outboundFlights });

    } catch (error) {
        console.error("Departures API Error:", error);
        return Response.json({ error: "Failed to fetch departures data", data: [] }, { status: 500 });
    }
}
