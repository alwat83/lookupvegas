import { db } from '../../../../lib/firebaseAdmin';
import { getOpenSkyToken } from '../../../lib/opensky';
import * as cheerio from 'cheerio';

export async function GET(request) {
    try {
        // 1. Secure the Cron Job Endpoint
        const authHeader = request.headers.get('authorization');
        if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch OpenSky Flight Data (Yesterday's Trailing Volume)
        const now = new Date();
        const end = Math.floor(now.setDate(now.getDate() - 1) / 1000);
        const begin = end - (24 * 60 * 60);

        const openSkyToken = await getOpenSkyToken();
        const osHeaders = openSkyToken ? { "Authorization": `Bearer ${openSkyToken}` } : {};

        const flightRes = await fetch(
            `https://opensky-network.org/api/flights/arrival?airport=KLAS&begin=${begin}&end=${end}`,
            { headers: osHeaders }
        );

        let totalArrivals = 0;
        if (flightRes.ok) {
            const flightData = await flightRes.json();
            totalArrivals = flightData.length || 0;
        }

        // 3. Synthesize Hotel Compression via Event Web Scraping
        let compressionScore = 50.0; // Default Neutral
        try {
            const eventRes = await fetch('https://lasvegasweekly.com/events/', {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (eventRes.ok) {
                const html = await eventRes.text();
                const $ = cheerio.load(html);
                let eventsStr = "";
                $('.event-item, .list-item, article.event').slice(0, 10).each((i, el) => {
                    eventsStr += $(el).text().toLowerCase() + " ";
                });
                
                if (eventsStr.includes('f1') || eventsStr.includes('grand prix') || eventsStr.includes('ces') || eventsStr.includes('super bowl')) {
                    compressionScore = 98;
                } else if (eventsStr.includes('stadium') || eventsStr.includes('raiders') || eventsStr.includes('festival') || eventsStr.includes('sphere')) {
                    compressionScore = 78;
                } else if (eventsStr.length > 50) {
                    compressionScore = 65;
                }
            }
        } catch (e) {
            console.warn("Snapshot event scraper failed", e);
        }

        // 4. Calculate City Velocity Index
        // (Weighted composite: Flights 60%, Hotels 40%. Baseline flights ~450)
        // Adjust for typical daily arrivals if OpenSky yields different baseline
        const flightVelocity = Math.min((totalArrivals / 450) * 50, 100);
        const cityVelocityIndex = (flightVelocity * 0.6) + (compressionScore * 0.4);

        // 5. Insert Snapshot into Firebase Firestore
        const snapshotDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const docRef = db.collection('daily_metrics').doc(snapshotDate);
        await docRef.set({
            date: snapshotDate,
            flight_arrivals_total: totalArrivals,
            hotel_compression_score: compressionScore,
            city_velocity_index: cityVelocityIndex,
            timestamp: new Date().toISOString()
        }, { merge: true });

        return Response.json({
            message: "Snapshot successful",
            data: { date: snapshotDate, arrivals: totalArrivals, compression: compressionScore, velocity: cityVelocityIndex }
        }, { status: 200 });

    } catch (error) {
        console.error("Cron Snapshot Error:", error);
        return Response.json({ error: "Failed to execute daily snapshot" }, { status: 500 });
    }
}
