import { classifyAircraft, estimatePassengers, computeNetFlow, computeArrivalRate, computeAircraftMixScore, computePrivateJetIndex, getDemandPressureLabel, computeEstimatedDailyPax } from '../../../../lib/flightUtils';
import { logEvent } from '../../../../lib/structuredLog';

export const dynamic = 'force-dynamic';

// Never expose a raw Error's stack trace, the upstream payload, or
// environment details -- only a short, human-readable reason.
function sanitizeErrorReason(err) {
    const message = typeof err?.message === 'string' && err.message ? err.message : 'unknown error';
    return message.length > 200 ? `${message.slice(0, 200)}...` : message;
}

// Every division in lib/flightUtils.js already guards its own zero case,
// so no currently-reachable input actually drives a computed field
// non-finite -- this exists as a safety net against a future change
// removing one of those guards, not a condition demonstrable through the
// live route today. Exported so that claim is verifiable directly rather
// than asserted.
export function findNonFiniteFields(fields) {
    return Object.entries(fields)
        .filter(([, value]) => typeof value !== 'number' || !Number.isFinite(value))
        .map(([field]) => field);
}

export async function GET(request) {
    // LV-005 health contract: additive to the existing response shape.
    // `source` and `status` make a degraded run explicit instead of
    // letting "the HTTP call to ADSB.lol returned 200" stand in for
    // "the data is real" -- a fetch can succeed while returning nothing
    // usable, and that must not look identical to a genuinely quiet sky.
    let source = 'live';
    let status = 'success';
    const errorSummary = [];

    try {
        let inboundCount = 0;
        let outboundCount = 0;
        let estArrPax = 0;
        let estDepPax = 0;
        let privJetsIn = 0;
        let flights = [];
        let mix = { commercial: 0, private: 0, cargo: 0, other: 0 };

        let flightRes = null;
        try {
            flightRes = await fetch('https://api.adsb.lol/v2/lat/36.0840/lon/-115.1537/dist/50', { next: { revalidate: 30 } });
        } catch (fetchErr) {
            const reason = sanitizeErrorReason(fetchErr);
            source = 'fallback';
            status = 'partial';
            errorSummary.push(`ADSB.lol request failed: ${reason}`);
            logEvent({
                severity: 'ERROR',
                event: 'aviation_source_failed',
                message: 'ADSB.lol fetch failed at the network level; returning fallback aviation data.',
                source: 'adsb',
                error: reason,
            });
        }

        if (flightRes) {
            if (flightRes.ok) {
                let data = null;
                try {
                    data = await flightRes.json();
                } catch (parseErr) {
                    const reason = sanitizeErrorReason(parseErr);
                    source = 'fallback';
                    status = 'partial';
                    errorSummary.push(`ADSB.lol response could not be parsed: ${reason}`);
                    logEvent({
                        severity: 'ERROR',
                        event: 'aviation_source_failed',
                        message: 'ADSB.lol returned a response that could not be parsed as JSON.',
                        source: 'adsb',
                        error: reason,
                    });
                }

                // A missing or non-array `.ac` is a malformed response, not
                // a legitimate empty sky -- `data.ac || []` previously
                // treated both identically. An array that IS present and
                // simply empty is real data: zero aircraft is a valid
                // reading, not a failure.
                if (data !== null && !Array.isArray(data.ac)) {
                    source = 'fallback';
                    status = 'partial';
                    errorSummary.push('ADSB.lol response was missing the expected "ac" array');
                    logEvent({
                        severity: 'ERROR',
                        event: 'aviation_source_failed',
                        message: 'ADSB.lol response was missing the expected "ac" array.',
                        source: 'adsb',
                    });
                    data = null;
                }

                if (data !== null) {
                    const ac = data.ac;

                    ac.forEach(f => {
                        if (!f.flight) return;
                        const callsign = f.flight.trim();
                        const type = f.t || '';
                        const alt = f.alt_baro || 0;
                        const rate = f.baro_rate || 0;

                        const cat = classifyAircraft(type, callsign);
                        const pax = estimatePassengers(type);

                        const isDesc = alt < 20000 && rate < -200;
                        const isClimb = alt < 20000 && rate > 200;

                        if (isDesc) {
                            inboundCount++;
                            estArrPax += pax;
                            if (cat === 'Private') privJetsIn++;
                        } else if (isClimb) {
                            outboundCount++;
                            estDepPax += pax;
                        }

                        if (isDesc || isClimb) {
                            flights.push({ type, category: cat });
                            if (cat === 'Commercial') mix.commercial++;
                            else if (cat === 'Private') mix.private++;
                            else if (cat === 'Cargo') mix.cargo++;
                            else mix.other++;
                        }
                    });
                }
            } else {
                source = 'fallback';
                status = 'partial';
                errorSummary.push(`ADSB.lol upstream returned HTTP ${flightRes.status}`);
                logEvent({
                    severity: 'ERROR',
                    event: 'aviation_source_failed',
                    message: `ADSB.lol returned HTTP ${flightRes.status}; returning fallback aviation data.`,
                    source: 'adsb',
                    error: `HTTP ${flightRes.status}`,
                });
            }
        }

        const totalMix = mix.commercial + mix.private + mix.cargo + mix.other;
        if (totalMix > 0) {
            mix.commercial = Math.round((mix.commercial / totalMix) * 100);
            mix.private = Math.round((mix.private / totalMix) * 100);
            mix.cargo = Math.round((mix.cargo / totalMix) * 100);
            mix.other = Math.round((mix.other / totalMix) * 100);
        }

        const netFlow = computeNetFlow(inboundCount, outboundCount);
        const arrivalRate = computeArrivalRate(inboundCount, 12); // ~12 mins to land from 50mi
        const aircraftMixScore = computeAircraftMixScore(flights);
        const privateJetIndex = computePrivateJetIndex(privJetsIn, inboundCount);
        const demandPressure = getDemandPressureLabel(netFlow, arrivalRate);
        const currentHour = new Date().getUTCHours() - 7;
        const normalizedHour = currentHour < 0 ? currentHour + 24 : currentHour;
        const estDailyPax = computeEstimatedDailyPax(arrivalRate * 160, normalizedHour);

        // Defense in depth: regardless of *why*, a non-finite computed
        // value must never be presented as healthy live data. This does
        // not touch or redesign any of the computation functions above --
        // it only validates their output.
        const computedFields = {
            inboundFlights: inboundCount,
            outboundFlights: outboundCount,
            estimatedArrivingPax: estArrPax,
            estimatedDepartingPax: estDepPax,
            estimatedDailyPax: estDailyPax,
            privateJetIndex,
            arrivalRatePerHour: arrivalRate,
        };
        for (const field of findNonFiniteFields(computedFields)) {
            source = 'fallback';
            status = 'partial';
            errorSummary.push(`computed field "${field}" was not a finite number`);
            logEvent({
                severity: 'ERROR',
                event: 'aviation_source_failed',
                message: `Computed aviation field "${field}" was not a finite number.`,
                source: 'aviation',
            });
        }

        const weatherRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=36.1628&longitude=-115.1398&current=temperature_2m,wind_speed_10m,precipitation&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FLos_Angeles', { next: { revalidate: 1800 } });
        let weather = null;
        if (weatherRes.ok) {
            const w = await weatherRes.json();
            const temp = w.current?.temperature_2m || 0;
            const wind = w.current?.wind_speed_10m || 0;
            const precip = w.current?.precipitation || 0;
            let impact = 0;
            let conditions = [];
            if (temp >= 105) { impact += 40; conditions.push('High Heat'); }
            if (wind >= 20) { impact += 30; conditions.push('High Winds'); }
            if (precip > 0.1) { impact += 30; conditions.push('Rain'); }
            if (conditions.length === 0) conditions.push('Clear Skies');
            let severity = 'Optimal';
            if (impact >= 50) severity = 'High Impact';
            else if (impact > 0) severity = 'Minor Delay';
            weather = {
                temp: Math.round(temp),
                wind: Math.round(wind),
                conditions: conditions.join(', '),
                impactScore: impact,
                severity
            };
        }

        let casinoInsight = "Normal baseline high-roller traffic.";
        if (privateJetIndex > 1.5) casinoInsight = "Elevated VIP arrivals detected. Prepare premium gaming floors.";
        else if (privateJetIndex > 1.0) casinoInsight = "Above average private jet arrivals indicating strong high-roller presence.";

        let hospitalityInsight = "Occupancy pressure is stable.";
        if (demandPressure === 'SURGING' || demandPressure === 'HIGH') hospitalityInsight = "Net inbound flow is high. Expect elevated occupancy and check-in pressure in the next 4 hours.";

        let transportInsight = "Standard airport pickup demand.";
        if (arrivalRate > 40) transportInsight = `High arrival rate (~${arrivalRate}/hr). Peak ride-share and taxi demand at KLAS terminals right now.`;

        let retailInsight = "Stable visitor volume.";
        if (netFlow.direction === 'INBOUND' && netFlow.value > 10) retailInsight = "Strong influx of visitors into the city today; expect increased foot traffic in the next 24 hours.";

        return Response.json({
            timestamp: new Date().toISOString(),
            dataSource: "ADSB.lol (Live ADS-B)",
            refreshRate: "30 seconds",
            currentSnapshot: {
                inboundFlights: inboundCount,
                outboundFlights: outboundCount,
                netFlow,
                estimatedArrivingPax: estArrPax,
                estimatedDepartingPax: estDepPax,
                estimatedDailyPax: estDailyPax,
                privateJetsInbound: privJetsIn,
                privateJetIndex,
                aircraftMix: mix,
                aircraftMixScore,
                arrivalRatePerHour: arrivalRate,
                demandPressure
            },
            weather,
            stakeholderInsights: {
                casino: casinoInsight,
                hospitality: hospitalityInsight,
                transport: transportInsight,
                retail: retailInsight,
                events: "Event weekend traffic modeling active based on live inbound capacity vs outbound."
            },
            dataProvenance: {
                flights: "LIVE — ADSB.lol ADS-B telemetry",
                passengers: "ESTIMATED — Aircraft type × 85% load factor",
                weather: "LIVE — Open-Meteo API",
                insights: "COMPUTED — Derived from live signals"
            },
            source,
            status,
            error_summary: errorSummary,
        });
    } catch (err) {
        const reason = sanitizeErrorReason(err);
        logEvent({
            severity: 'ERROR',
            event: 'aviation_endpoint_failed',
            message: 'Unhandled error in the aviation snapshot endpoint.',
            source: 'aviation',
            error: reason,
        });
        return Response.json({
            error: reason,
            source: 'fallback',
            status: 'partial',
            error_summary: [reason],
        }, { status: 500 });
    }
}
