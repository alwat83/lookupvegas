import { db } from '../../../../lib/firebaseAdmin';

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const origin = url.origin;

        // 1. Fetch live metrics
        let totalArrivals = 450; // Fallback
        let privateJetIndex = 1.0;
        try {
            const avRes = await fetch(`${origin}/api/aviation/snapshot`);
            if (avRes.ok) {
                const avData = await avRes.json();
                if (avData.currentSnapshot) {
                    totalArrivals = avData.currentSnapshot.inboundFlights * 24; 
                }
            }
        } catch(e) {}

        // Fetch OpenSky for yesterday's true volume
        const now = new Date();
        const end = Math.floor(now.setDate(now.getDate() - 1) / 1000);
        const begin = end - (24 * 60 * 60);
        try {
            const osRes = await fetch(`https://opensky-network.org/api/flights/arrival?airport=KLAS&begin=${begin}&end=${end}`);
            if (osRes.ok) {
                const osData = await osRes.json();
                totalArrivals = osData.length || totalArrivals;
            }
        } catch (e) {}

        // 2. Fetch Event Impact from /api/hotels
        let eventImpact = 50.0;
        try {
            const hRes = await fetch(`${origin}/api/hotels`);
            if (hRes.ok) {
                const hData = await hRes.json();
                eventImpact = hData.data.compressionScore || 50.0;
            }
        } catch(e) {}

        // Fetch Private Jet Index (via ADSB)
        try {
            const adsbRes = await fetch('https://api.adsb.lol/v2/lat/36.0840/lon/-115.1537/dist/50');
            if (adsbRes.ok) {
                const adsbData = await adsbRes.json();
                let privCount = 0;
                let commCount = 0;
                (adsbData.ac || []).forEach(f => {
                    if (f.alt_baro < 20000 && f.baro_rate < -200) {
                        const callsign = f.flight ? f.flight.trim() : '';
                        if (callsign.startsWith('N') && callsign.length <= 6) privCount++;
                        else commCount++;
                    }
                });
                const total = privCount + commCount;
                if (total > 0) {
                    privateJetIndex = (privCount / total) / 0.08;
                }
            }
        } catch(e) {}

        // 3. Historical Firestore Analysis (flightScore & demandMomentum)
        let flightScore = 50; // Baseline
        let demandMomentum = 50; 
        
        try {
            const snapshot = await db.collection('daily_metrics').orderBy('date', 'desc').limit(30).get();
            const docs = snapshot.docs.map(d => d.data());
            
            if (docs.length >= 7) {
                const arrivals = docs.map(d => d.flight_arrivals_total || 450);
                
                // flightScore Z-score
                const mean = arrivals.reduce((a,b) => a+b, 0) / arrivals.length;
                const variance = arrivals.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / arrivals.length;
                const stddev = Math.sqrt(variance) || 1;
                const zScore = (totalArrivals - mean) / stddev; // typically -3 to +3
                flightScore = Math.max(0, Math.min(100, 50 + (zScore * 16.67))); // Map -3/3 to 0/100

                // demandMomentum
                const last7 = arrivals.slice(0, 7);
                const prior7 = arrivals.slice(7, 14);
                if (prior7.length > 0) {
                    const avgLast7 = last7.reduce((a,b) => a+b, 0) / last7.length;
                    const avgPrior7 = prior7.reduce((a,b) => a+b, 0) / prior7.length;
                    const diff = ((avgLast7 - avgPrior7) / avgPrior7) * 100; // % change
                    demandMomentum = Math.max(0, Math.min(100, 50 + (diff * 2.5)));
                }
            } else {
                // Fallback flight score
                flightScore = Math.min((totalArrivals / 450) * 50, 100);
            }
        } catch (e) {
            console.warn("Firestore analysis failed", e);
        }

        // 4. Weather Score
        let weatherImpactScore = 0;
        try {
            const wRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=36.1628&longitude=-115.1398&current=temperature_2m,wind_speed_10m,precipitation&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FLos_Angeles');
            if (wRes.ok) {
                const wData = await wRes.json();
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
            }
        } catch (e) {}

        const weatherPenalty = (weatherImpactScore / 100) * 15;
        const weatherScore = Math.max(0, 100 - (weatherPenalty * 6.67)); // 0 penalty = 100

        // 5. Compute CVI
        const privateJetIndex_normalized = Math.min(100, privateJetIndex * 50);

        const cityVelocityIndex = (flightScore * 0.35) 
                                + (demandMomentum * 0.25) 
                                + (eventImpact * 0.20) 
                                + (weatherScore * 0.10) 
                                + (privateJetIndex_normalized * 0.10);

        // Insert Snapshot into Firebase Firestore
        const snapshotDate = new Date().toISOString().split('T')[0];

        try {
            const docRef = db.collection('daily_metrics').doc(snapshotDate);
            await docRef.set({
                date: snapshotDate,
                flight_arrivals_total: totalArrivals,
                hotel_compression_score: eventImpact,
                city_velocity_index: cityVelocityIndex,
                private_jet_count: privateJetIndex,
                demand_momentum: demandMomentum,
                event_impact_score: eventImpact,
                timestamp: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            console.error("Firestore write failed", e);
        }

        return Response.json({
            message: "Snapshot successful",
            data: { 
                date: snapshotDate, 
                arrivals: totalArrivals, 
                compression: eventImpact, 
                velocity: cityVelocityIndex,
                flightScore,
                demandMomentum,
                weatherScore,
                privateJetIndex_normalized
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Cron Snapshot Error:", error);
        return Response.json({ error: "Failed to execute daily snapshot" }, { status: 500 });
    }
}
