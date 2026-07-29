import { db } from '../../../../lib/firebaseAdmin';
import { logEvent } from '../../../../lib/structuredLog';
import { businessDateString, previousBusinessDateString, isValidBusinessDateString } from '../../../../lib/businessDate';
import { selectFiniteNumber } from '../../../../lib/numericSelection';
import { isPrivateJet } from '../../../../lib/flightUtils';
import { SCHEMA_VERSION } from '../../../../lib/archiveValidation';

const CVI_VERSION = 'v1'; // The weighting formula itself -- unchanged by LV-004.
// SCHEMA_VERSION (the document *shape*) is the single source of truth in
// lib/archiveValidation.js, not duplicated here -- LV-008 bumped it to 'v3'
// there specifically so this route and the validator can never disagree
// about which schema generation a newly-written document belongs to.
// Tracked separately from CVI_VERSION on purpose: a document's schema can
// change (new fields recorded) without the underlying calculation changing,
// and vice versa -- conflating the two would make it impossible to tell
// which kind of change actually happened to a given historical record.

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

    const url = new URL(request.url);
    const origin = url.origin;
    const todayDate = businessDateString();
    const requestedDate = url.searchParams.get('date');
    const force = url.searchParams.get('force') === 'true';

    // Backfill: an operator can target a specific past business date rather
    // than always "today." This does NOT re-fetch true historical
    // conditions for that date -- the upstream APIs below only ever serve
    // current data, so a backfilled record's source_freshness values
    // reflect conditions at run time, not the labeled date. See the
    // `backfilled` flag on the persisted record and docs/LV-004 for the
    // full reproducibility analysis. Never allowed to target the future.
    if (requestedDate !== null) {
        if (!isValidBusinessDateString(requestedDate)) {
            return Response.json({ error: 'date must be a valid YYYY-MM-DD calendar date' }, { status: 400 });
        }
        if (requestedDate > todayDate) {
            return Response.json({ error: 'date cannot be in the future' }, { status: 400 });
        }
    }

    const snapshotDate = requestedDate ?? todayDate;
    const isBackfill = snapshotDate !== todayDate;
    const docRef = db.collection('daily_metrics').doc(snapshotDate);

    // Idempotency: a duplicate scheduler delivery (or a manual re-trigger)
    // for a date that already completed successfully is a no-op, not a
    // recompute, UNLESS force=true is explicitly supplied. This is what
    // actually prevents duplicate delivery -- or an accidental backfill
    // request -- from silently producing a different value for a business
    // day that already has a trusted record. The deterministic doc ID
    // alone only prevents a second *document*, not a second, possibly
    // different, overwrite.
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

    if (existingDoc.exists && existingDoc.data().status === 'success' && !force) {
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

    if (existingDoc.exists && existingDoc.data().status === 'success' && force) {
        logEvent({
            severity: 'WARNING',
            event: 'snapshot_forced_overwrite',
            message: 'Overwriting a previously successful record because force=true was explicitly supplied.',
            snapshotDate,
            status: 'success',
        });
    }

    const sourceFreshness = {};
    const errors = [];

    // 1. Fetch live metrics
    let totalArrivals = 450; // Fallback
    // LV-008: renamed from privateJetIndex -- this is a baseline-relative
    // index ((private/total)/0.08), not a literal count, and internal
    // naming should say so. Purely a variable-clarity rename; the value
    // and formula are unchanged.
    let privateJetActivityIndex = 1.0;
    try {
        const avRes = await fetch(`${origin}/api/aviation/snapshot`);
        if (avRes.ok) {
            const avData = await avRes.json();
            if (avData.currentSnapshot) {
                totalArrivals = avData.currentSnapshot.inboundFlights * 24;
            }
            // LV-005: the aviation endpoint can return HTTP 200 while
            // internally degraded (its own upstream failed, or its
            // response was malformed) -- it now says so explicitly via
            // source/status rather than a 200 alone standing in for
            // "the data is real." Anything other than exactly
            // source: 'live' + status: 'success' is treated as fallback,
            // including an unrecognized or missing value -- fail closed,
            // not fail open.
            if (avData.source === 'live' && avData.status === 'success') {
                sourceFreshness.aviation = 'ok';
            } else {
                sourceFreshness.aviation = 'fallback';
                const reason = Array.isArray(avData.error_summary) && avData.error_summary.length > 0
                    ? avData.error_summary.join('; ')
                    : `aviation endpoint reported source=${avData.source ?? 'unknown'} status=${avData.status ?? 'unknown'}`;
                errors.push(`aviation snapshot degraded: ${reason}`);
                logEvent({
                    severity: 'ERROR',
                    event: 'snapshot_source_failed',
                    message: 'Aviation snapshot reported degraded/fallback data.',
                    snapshotDate,
                    source: 'aviation',
                    error: reason,
                });
            }
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
            // LV-006: osData.length || totalArrivals treated a genuinely
            // empty (but valid) OpenSky result identically to a malformed
            // one -- both silently kept the prior value, and both were
            // marked 'ok' regardless. A real empty array is a real zero
            // and must explicitly override; a non-array payload is
            // malformed and must neither become zero nor be labeled ok.
            if (Array.isArray(osData)) {
                totalArrivals = osData.length;
                sourceFreshness.openSky = 'ok';
            } else {
                sourceFreshness.openSky = 'fallback';
                errors.push('OpenSky response was not a valid array; keeping the prior arrivals estimate');
                logEvent({
                    severity: 'ERROR',
                    event: 'snapshot_source_failed',
                    message: 'OpenSky response was malformed (not an array); keeping the prior arrivals estimate.',
                    snapshotDate,
                    source: 'openSky',
                });
            }
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
            // The hotels endpoint returns HTTP 200 even when it has
            // internally failed and substituted its own hardcoded fallback
            // values -- it already tells the truth via `source: 'fallback'`
            // in that case, but this was never checked, so a hotels-side
            // failure was previously invisible here and recorded as 'ok'.
            if (hData.source === 'fallback') {
                sourceFreshness.hotels = 'fallback';
                errors.push('hotels endpoint returned its internal fallback value (its own upstream sources failed)');
            } else {
                sourceFreshness.hotels = 'ok';
            }
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
            // LV-007: classification now goes through the same shared
            // isPrivateJet() the live aviation dashboard already uses,
            // instead of a second, cruder, type-blind heuristic that
            // never looked at aircraft type and never normalized
            // callsign case. Only the classification decision changed --
            // the descending-aircraft filter and the ratio math below are
            // untouched.
            (adsbData.ac || []).forEach(f => {
                if (f.alt_baro < 20000 && f.baro_rate < -200) {
                    if (isPrivateJet(f.t, f.flight)) privCount++;
                    else commCount++;
                }
            });
            const total = privCount + commCount;
            if (total > 0) {
                privateJetActivityIndex = (privCount / total) / 0.08;
            }
            logEvent({
                severity: 'INFO',
                event: 'snapshot_adsb_classification_summary',
                message: `Classified ${total} descending aircraft: ${privCount} private, ${commCount} not private.`,
                snapshotDate,
                source: 'adsb',
            });
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
        // Filtered to dates strictly before the one being computed -- not
        // just "the most recent 30 regardless of target." For a normal
        // same-day run this is equivalent (today's own document doesn't
        // exist yet). For a backfilled historical date, this is the
        // difference between a rolling window that's causally correct
        // (only days before the target) and one that would silently pull
        // in days *after* it, which is wrong for a historical record no
        // matter how the CVI formula itself is weighted.
        const snapshot = await db.collection('daily_metrics')
            .where('date', '<', snapshotDate)
            .orderBy('date', 'desc')
            .limit(30)
            .get();
        const docs = snapshot.docs.map(d => d.data());

        // Missing/failed-snapshot detection: surface a gap in the prior
        // day's record the moment we're already looking at this
        // collection, rather than adding a second query just to check.
        // Computed relative to snapshotDate, not real-world "now" -- so
        // this is meaningful during a backfill too, not just a live run.
        const yesterdayDate = previousBusinessDateString(snapshotDate);
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
            // LV-006: d.flight_arrivals_total || 450 treated an archived
            // genuine zero-arrivals day identically to a missing/invalid
            // field, silently inflating it to 450 and corrupting the
            // rolling mean/stddev -- and therefore every flightScore and
            // demandMomentum computed against this window. 0 is now
            // preserved; only a missing, non-finite, negative, or
            // wrong-type value falls back to 450.
            const arrivals = docs.map(d => selectFiniteNumber(d.flight_arrivals_total, 450));

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
    const privateJetIndex_normalized = Math.min(100, privateJetActivityIndex * 50);

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
        // LV-008: private_jet_count never stored a literal count -- it's
        // this same baseline-relative index, just misleadingly named.
        // private_jet_activity_index is the canonical, correctly-named
        // field, dual-written alongside the deprecated alias below so
        // existing readers of either field keep working unchanged.
        private_jet_activity_index: privateJetActivityIndex,
        // Deprecated compatibility alias. This value is an activity
        // index, not a count. Kept numerically identical to
        // private_jet_activity_index above; not removed in LV-008 --
        // see docs/LV-008-private-jet-metric-naming.md for the
        // deprecation and eventual-removal policy.
        private_jet_count: privateJetActivityIndex,
        demand_momentum: demandMomentum,
        event_impact_score: eventImpact,
        timestamp: new Date().toISOString(),
        cvi_version: CVI_VERSION,
        schema_version: SCHEMA_VERSION,
        source_freshness: sourceFreshness,
        status,
        error_summary: errors,
        execution_duration_ms: executionDurationMs,
        // Clearly-named operational metadata, not a new dataset: marks a
        // record produced by targeting a past date via ?date=. The values
        // below still reflect upstream conditions AT RUN TIME, never the
        // true historical conditions for snapshotDate -- see docs/LV-004.
        backfilled: isBackfill,
        // The three CVI component scores that were always computed above
        // but, before LV-004, were never persisted -- only two of the
        // formula's five weighted terms (demand_momentum, event_impact_score)
        // were ever recoverable from a stored document. Without these,
        // city_velocity_index could not be arithmetically verified from the
        // archive at all. No formula or weighting changed; these are the
        // same in-memory values that already existed, now written down.
        flight_score: flightScore,
        weather_score: weatherScore,
        private_jet_index_normalized: privateJetIndex_normalized,
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
        backfilled: isBackfill,
        sourceFreshness,
        data: {
            date: snapshotDate,
            arrivals: totalArrivals,
            compression: eventImpact,
            velocity: cityVelocityIndex,
            flightScore,
            demandMomentum,
            weatherScore,
            privateJetActivityIndex,
            privateJetIndex_normalized,
        },
    }, { status: 200 });
}
