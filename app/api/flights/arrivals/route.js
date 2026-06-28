import { getOpenSkyToken } from '../../../lib/opensky';
import { getUserProfile } from '../../../../lib/authMiddleware';
import { classifyAircraft, estimatePassengers, estimateOrigin } from '../../../../lib/flightUtils';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { tier, isPremium } = await getUserProfile(req);

        // Fetch 50 miles around Las Vegas (KLAS)
        const response = await fetch(
            `https://api.adsb.lol/v2/lat/36.0840/lon/-115.1537/dist/50`,
            {
                next: { revalidate: 30 }, // Cache for 30s
            }
        );

        if (!response.ok) {
            return Response.json({ error: "ADSB rate limit or unavailability", data: [], metrics: {} }, { status: 200 });
        }

        const data = await response.json();

        let totalEstimatedPassengers = 0;
        let totalPrivateJets = 0;

        // Find planes that are descending (Inbound/Arrivals)
        let inboundFlights = (data.ac || []).filter(state =>
            state.flight && state.alt_baro < 20000 && state.baro_rate < -200
        ).map(state => {
            const callsign = state.flight.trim();
            const type = state.t || '';
            const registration = state.r || '';
            const category = classifyAircraft(type, callsign);
            const estPax = estimatePassengers(type);
            
            if (category === 'Commercial') totalEstimatedPassengers += estPax;
            if (category === 'Private') totalPrivateJets += 1;

            return {
                icao24: state.hex,
                callsign: callsign,
                type: type,
                registration: registration,
                category: category,
                estimatedPassengers: estPax,
                origin: estimateOrigin(callsign), // Live telemetry lacks origins natively, simulate based on callsign
                destination: 'KLAS',
                firstSeen: Math.floor(Date.now() / 1000) - 1800, // mock duration for UI
                lastSeen: Math.floor(Date.now() / 1000),
                status: 'Inbound'
            };
        }).sort((a, b) => b.lastSeen - a.lastSeen); // Match legacy UI sort

        // Apply free-tier degradation only in production so we can see all live data locally
        if (!isPremium && process.env.NODE_ENV !== 'development') {
            const delayOffset = 72 * 3600; // 72 hours
            inboundFlights = inboundFlights.map(f => ({
                ...f,
                firstSeen: f.firstSeen - delayOffset,
                lastSeen: f.lastSeen - delayOffset
            }));
            // Shuffle a bit to degrade data
            inboundFlights = inboundFlights.sort(() => Math.random() - 0.5).slice(0, Math.max(1, Math.floor(inboundFlights.length * 0.7)));
        }

        return Response.json({ 
            data: inboundFlights,
            delayed: !isPremium,
            metrics: {
                totalEstimatedPassengers,
                totalPrivateJets
            }
        });

    } catch (error) {
        console.error("Arrivals API Error:", error);
        return Response.json({ error: "Failed to fetch arrivals data", data: [] }, { status: 500 });
    }
}
