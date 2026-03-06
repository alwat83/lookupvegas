import { getOpenSkyToken } from '../../../lib/opensky';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const now = new Date();
        const currentUnix = Math.floor(now.getTime() / 1000);
        // Round to nearest 5 minutes (300s) to allow Next.js fetch caching to work correctly
        const end = currentUnix - (currentUnix % 300);
        const begin = end - (6 * 60 * 60);

        const authHeader = await getOpenSkyToken();
        const headers = authHeader ? { "Authorization": authHeader } : {};

        const openSkyUrl = `https://opensky-network.org/api/flights/arrival?airport=KLAS&begin=${begin}&end=${end}`;
        const proxyUrl = `https://opensky-proxy.lookupvegas.workers.dev/?url=${encodeURIComponent(openSkyUrl)}`;

        const response = await fetch(
            proxyUrl,
            {
                headers,
                next: { revalidate: 300 }, // Cache for 5 minutes
            }
        );

        if (!response.ok) {
            return Response.json({ error: "OpenSky rate limit or unavailability", data: [] }, { status: 200 });
        }

        const data = await response.json();
        const flightList = Array.isArray(data) ? data : [];

        // Format for the Terminal UI
        const flights = flightList.map(f => ({
            icao24: f.icao24,
            callsign: f.callsign ? f.callsign.trim() : 'UNKNOWN',
            origin: f.estDepartureAirport || 'UNKNOWN',
            destination: f.estArrivalAirport || 'KLAS',
            firstSeen: f.firstSeen,
            lastSeen: f.lastSeen,
            status: 'Arrived'
        })).sort((a, b) => b.lastSeen - a.lastSeen); // Most recent first

        return Response.json({ data: flights });

    } catch (error) {
        console.error("Arrivals API Error:", error);
        return Response.json({ error: "Failed to fetch arrivals data", data: [] }, { status: 500 });
    }
}
