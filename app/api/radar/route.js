import { getOpenSkyToken } from '../../lib/opensky';

export async function GET() {
    try {
        const token = await getOpenSkyToken();
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};

        // Las Vegas Bounding Box
        // lamin, lomin, lamax, lomax
        const lamin = 35.8;
        const lomin = -115.5;
        const lamax = 36.5;
        const lomax = -114.8;

        const response = await fetch(
            `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`,
            {
                headers,
                next: { revalidate: 15 }, // Cache for 15 seconds to simulate live radar while respecting limits
            }
        );

        if (!response.ok) {
            return Response.json({ error: "Upstream radar API error or rate limit", data: [] }, { status: 200 });
        }

        const data = await response.json();

        // Parse the state vectors
        // Array format from OpenSky:
        // [0] icao24, [1] callsign, [2] origin_country, [3] time_position, [4] last_contact,
        // [5] longitude, [6] latitude, [7] baro_altitude, [8] on_ground, [9] velocity, [10] true_track

        const activeFlights = (data.states || []).map(state => ({
            icao: state[0],
            callsign: state[1] ? state[1].trim() : 'UNKNOWN',
            country: state[2],
            longitude: state[5],
            latitude: state[6],
            altitude: state[7], // meters
            velocity: state[9], // m/s
            heading: state[10] // degrees
        })).filter(f => f.longitude && f.latitude && !f.on_ground);

        return Response.json({
            data: activeFlights
        });

    } catch (error) {
        console.error("Radar API Error:", error);
        return Response.json({ error: "Failed to fetch live radar data", data: [] }, { status: 200 });
    }
}
