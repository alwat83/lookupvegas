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
        let cityVelocityIndex = (flightVelocity * 0.6) + (compressionScore * 0.4);

        // 4.5. Synthesize Weather Impacts
        let weatherImpactScore = 0;
        try {
            const url = 'https://api.open-meteo.com/v1/forecast?latitude=36.1628&longitude=-115.1398&current=temperature_2m,wind_speed_10m,precipitation&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FLos_Angeles';
            const weatherRes = await fetch(url);
            if (weatherRes.ok) {
                const wData = await weatherRes.json();
                const temp = wData.current?.temperature_2m || 0;
                const wind = wData.current?.wind_speed_10m || 0;
                const precip = wData.current?.precipitation || 0;

                if (temp >= 110) weatherImpactScore += 80;
                else if (temp >= 105) weatherImpactScore += 40;
                if (wind >= 30) weatherImpactScore += 60;
                else if (wind >= 20) weatherImpactScore += 30;
                if (precip > 0.5) weatherImpactScore += 50;
                else if (precip > 0.1) weatherImpactScore += 30;
                
                weatherImpactScore = Math.min(100, weatherImpactScore);
                
                // Weather Penalty: Severe weather reduces City Velocity by up to 15 points
                const weatherPenalty = (weatherImpactScore / 100) * 15;
                cityVelocityIndex = Math.max(0, cityVelocityIndex - weatherPenalty);
            }
        } catch (e) {
            console.warn("Snapshot weather scraper failed", e);
        }

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
