import { db } from '../../../../lib/firebaseAdmin';
import { logEvent } from '../../../../lib/structuredLog';
import { businessDateString } from '../../../../lib/businessDate';

const CVI_VERSION = 'v1';

export async function GET(request) {
    const startedAt = Date.now();

    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        logEvent({
            severity: 'ERROR',
            event: 'snapshot_misconfigured',
            message: 'CRON_SECRET is not set. Refusing all requests.',
        });
        return Response.json({ error: 'Cron is not configured' }, { status: 503 });
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
        logEvent({
            severity: 'WARNING',
            event: 'snapshot_auth_rejected',
            message: 'Rejected a snapshot invocation with a missing or incorrect Authorization header.',
        });
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshotDate = businessDateString();
    const docRef = db.collection('daily_metrics').doc(snapshotDate);

    // Idempotency: a duplicate scheduler delivery (or a manual re-trigger)
    // for a date that already completed successfully is a no-op, not a
    // recompute. This is what actually prevents duplicate delivery from
    // producing a different value for the same business day -- the
    // deterministic doc ID alone only prevents a second *document*, not a
    // second, possibly-different, overwrite.
    let existingDoc;
    try {
        existingDoc = await docRef.get();
    } catch (e) {
        logEvent({
            severity: 'ERROR',
            event: 'snapshot_idempotency_check_failed',
            message: 'Failed to check for an existing record before running the snapshot.',
            snapshotDate,
            status: 'failed',
            source: 'firestore',
            error: e.message,
            durationMs: Date.now() - startedAt,
        });
        return Response.json({ error: 'Failed to check snapshot state' }, { status: 500 });
    }

    if (existingDoc.exists && existingDoc.data().status === 'success') {
        logEvent({
            severity: 'INFO',
            event: 'snapshot_duplicate_skipped',
            message: 'Snapshot already completed for this date; skipping recomputation.',
            snapshotDate,
            status: 'already_completed',
            durationMs: Date.now() - startedAt,
        });
        return Response.json({
            message: 'Snapshot already completed for this date',
            date: snapshotDate,
            status: 'already_completed',
        }, { status: 200 });
    }

    const url = new URL(request.url);
    const origin = url.origin;
    const sourceFreshness = {};
    const errors = [];

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
            sourceFreshness.aviation = 'ok';
        } else {
            sourceFreshness.aviation = 'fallback';
            errors.push(`aviation snapshot returned ${avRes.status}`);
        }
    } catch (e) {
        sourceFreshness.aviation = 'fallback';
        errors.push(`aviation snapshot fetch failed: ${e.message}`);
        logEvent({
            severity: 'ERROR',
            event: 'snapshot_source_failed',
            message: 'Aviation snapshot fetch failed; falling back to default arrivals value.',
            snapshotDate,
            source: 'aviation',
            error: e.message,
        });
    }

    // Fetch OpenSky for yesterday's true volume
    const now = new Date();
    const end = Math.floor(now.setDate(now.getDate() - 1) / 1000);
    const begin = end - (24 * 60 * 60);
    try {
        const osRes = await fetch(`https://opensky-network.org/api/flights/arrival?airport=KLAS&begin=${begin}&end=${end}`);
        if (osRes.ok) {
            const osData = await osRes.json();
            totalArrivals = osData.length || totalArrivals;
            sourceFreshness.openSky = 'ok';
        } else {
            sourceFreshness.openSky = 'fallback';
            errors.push(`OpenSky returned ${osRes.status}`);
        }
    } catch (e) {
        sourceFreshness.openSky = 'fallback';
        errors.push(`OpenSky fetch failed: ${e.message}`);
        logEvent({
            severity: 'ERROR',
            event: 'snapshot_source_failed',
            message: 'OpenSky fetch failed; falling back to the aviation-derived arrivals estimate.',
            snapshotDate,
            source: 'openSky',
            error: e.message,
        });
    }

    // 2. Fetch Event Impact from /api/hotels
    let eventImpact = 50.0;
    try {
        const hRes = await fetch(`${origin}/api/hotels`);
        if (hRes.ok) {
            const hData = await hRes.json();
            eventImpact = hData.data.compressionScore || 50.0;
            sourceFreshness.hotels = 'ok';
        } else {
            sourceFreshness.hotels = 'fallback';
            errors.push(`hotels endpoint returned ${hRes.status}`);
        }
    } catch (e) {
        sourceFreshness.hotels = 'fallback';
        errors.push(`hotels fetch failed: ${e.message}`);
        logEvent({
            severity: 'ERROR',
            event: 'snapshot_source_failed',
            message: 'Hotels endpoint fetch failed; falling back to a default event-impact score.',
            snapshotDate,
            source: 'hotels',
            error: e.message,
        });
    }

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
            sourceFreshness.adsb = 'ok';
        } else {
            sourceFreshness.adsb = 'fallback';
            errors.push(`ADSB returned ${adsbRes.status}`);
        }
    } catch (e) {
        sourceFreshness.adsb = 'fallback';
        errors.push(`ADSB fetch failed: ${e.message}`);
        logEvent({
            severity: 'ERROR',
            event: 'snapshot_source_failed',
            message: 'ADSB fetch failed; falling back to a default private-jet index.',
            snapshotDate,
            source: 'adsb',
            error: e.message,
        });
    }

    // 3. Historical Firestore Analysis (flightScore & demandMomentum)
    let flightScore = 50; // Baseline
    let demandMomentum = 50;

    try {
        const snapshot = await db.collection('daily_metrics').orderBy('date', 'desc').limit(30).get();
        const docs = snapshot.docs.map(d => d.data());

        // Missing/failed-snapshot detection: surface a gap in yesterday's
        // record the moment we're already looking at this collection,
        // rather than adding a second query just to check.
        const yesterdayDate = businessDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
        const yesterdayDoc = docs.find(d => d.date === yesterdayDate);
        if (!yesterdayDoc || yesterdayDoc.status === 'failed') {
            logEvent({
                severity: 'ERROR',
                event: 'snapshot_gap_detected',
                message: `No successful record found for ${yesterdayDate} (yesterday). The historical archive may have a gap.`,
                snapshotDate: yesterdayDate,
                status: yesterdayDoc?.status || 'missing',
            });
        }

        if (docs.length >= 7) {
            const arrivals = docs.map(d => d.flight_arrivals_total || 450);

            // flightScore Z-score
            const mean = arrivals.reduce((a, b) => a + b, 0) / arrivals.length;
            const variance = arrivals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arrivals.length;
            const stddev = Math.sqrt(variance) || 1;
            const zScore = (totalArrivals - mean) / stddev; // typically -3 to +3
            flightScore = Math.max(0, Math.min(100, 50 + (zScore * 16.67))); // Map -3/3 to 0/100

            // demandMomentum
            const last7 = arrivals.slice(0, 7);
            const prior7 = arrivals.slice(7, 14);
            if (prior7.length > 0) {
                const avgLast7 = last7.reduce((a, b) => a + b, 0) / last7.length;
                const avgPrior7 = prior7.reduce((a, b) => a + b, 0) / prior7.length;
                const diff = ((avgLast7 - avgPrior7) / avgPrior7) * 100; // % change
                demandMomentum = Math.max(0, Math.min(100, 50 + (diff * 2.5)));
            }
        } else {
            // Fallback flight score
            flightScore = Math.min((totalArrivals / 450) * 50, 100);
        }
    } catch (e) {
        errors.push(`historical analysis failed: ${e.message}`);
        logEvent({
            severity: 'ERROR',
            event: 'snapshot_source_failed',
            message: 'Historical Firestore analysis failed; falling back to baseline flightScore/demandMomentum.',
            snapshotDate,
            source: 'firestore',
            error: e.message,
        });
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
            sourceFreshness.weather = 'ok';
        } else {
            sourceFreshness.weather = 'fallback';
            errors.push(`weather returned ${wRes.status}`);
        }
    } catch (e) {
        sourceFreshness.weather = 'fallback';
        errors.push(`weather fetch failed: ${e.message}`);
        logEvent({
            severity: 'ERROR',
            event: 'snapshot_source_failed',
            message: 'Weather fetch failed; falling back to a zero weather-impact score.',
            snapshotDate,
            source: 'weather',
            error: e.message,
        });
    }

    const weatherPenalty = (weatherImpactScore / 100) * 15;
    const weatherScore = Math.max(0, 100 - (weatherPenalty * 6.67)); // 0 penalty = 100

    // 5. Compute CVI
    const privateJetIndex_normalized = Math.min(100, privateJetIndex * 50);

    const cityVelocityIndex = (flightScore * 0.35)
        + (demandMomentum * 0.25)
        + (eventImpact * 0.20)
        + (weatherScore * 0.10)
        + (privateJetIndex_normalized * 0.10);

    const anyFallback = Object.values(sourceFreshness).some(v => v === 'fallback');
    const status = anyFallback || errors.length > 0 ? 'partial' : 'success';
    const executionDurationMs = Date.now() - startedAt;

    const record = {
        date: snapshotDate,
        flight_arrivals_total: totalArrivals,
        hotel_compression_score: eventImpact,
        city_velocity_index: cityVelocityIndex,
        private_jet_count: privateJetIndex,
        demand_momentum: demandMomentum,
        event_impact_score: eventImpact,
        timestamp: new Date().toISOString(),
        cvi_version: CVI_VERSION,
        source_freshness: sourceFreshness,
        status,
        error_summary: errors,
        execution_duration_ms: executionDurationMs,
    };

    try {
        await docRef.set(record, { merge: true });
    } catch (e) {
        logEvent({
            severity: 'ERROR',
            event: 'snapshot_persist_failed',
            message: 'Firestore write failed -- this run did NOT persist a snapshot.',
            snapshotDate,
            status: 'failed',
            source: 'firestore',
            error: e.message,
            durationMs: executionDurationMs,
        });
        return Response.json({
            error: 'Failed to persist snapshot',
            date: snapshotDate,
            status: 'failed',
        }, { status: 500 });
    }

    // The single event an operator or an alerting policy should key off of
    // for "did today's run actually finish, and how" -- distinct from the
    // per-source diagnostic events above, which explain *why* if this one
    // isn't a clean 'success'.
    logEvent({
        severity: status === 'partial' ? 'WARNING' : 'INFO',
        event: 'snapshot_run_complete',
        message: `Snapshot run for ${snapshotDate} completed with status ${status}.`,
        snapshotDate,
        status,
        durationMs: executionDurationMs,
    });

    return Response.json({
        message: 'Snapshot successful',
        date: snapshotDate,
        status,
        sourceFreshness,
        data: {
            date: snapshotDate,
            arrivals: totalArrivals,
            compression: eventImpact,
            velocity: cityVelocityIndex,
            flightScore,
            demandMomentum,
            weatherScore,
            privateJetIndex_normalized,
        },
    }, { status: 200 });
}
