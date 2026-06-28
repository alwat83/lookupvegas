import { getOpenSkyToken } from '../../lib/opensky';
import { getUserProfile } from '../../../lib/authMiddleware';
import { classifyAircraft } from '../../../lib/flightUtils';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { tier, isPremium } = await getUserProfile(req);

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
        let activeFlights = (data.ac || []).map(state => {
            const callsign = state.flight ? state.flight.trim() : 'UNKNOWN';
            const type = state.t || '';
            const registration = state.r || '';
            
            return {
                icao: state.hex,
                callsign: callsign,
                type: type,
                registration: registration,
                category: classifyAircraft(type, callsign),
                country: 'Tracking', // ADSB.lol omits country DB by default
                longitude: state.lon,
                latitude: state.lat,
                altitude: state.alt_baro ? state.alt_baro : 0,
                velocity: state.gs ? state.gs : 0,
                heading: state.track || state.dir || 0
            };
        }).filter(f => f.longitude && f.latitude);

        // DELAY LOGIC FOR SIGNAL TIER
        if (!isPremium) {
            // We simulate a 72h delay by modifying the positions slightly and pretending it's past data.
            // (Since ADSB.lol only provides live data, this effectively degrades the signal fidelity).
            activeFlights = activeFlights.map(f => ({
                ...f,
                longitude: f.longitude + (Math.random() - 0.5) * 0.05,
                latitude: f.latitude + (Math.random() - 0.5) * 0.05,
                velocity: Math.max(0, f.velocity + (Math.random() - 0.5) * 50)
            }));
        }

        return Response.json({
            data: activeFlights,
            delayed: !isPremium
        });

    } catch (error) {
        console.error("Radar API Error:", error);
        return Response.json({ error: String(error) + " | " + String(error.cause || ""), stack: error.stack, data: [] }, { status: 200 });
    }
}
