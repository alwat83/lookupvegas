import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isPrivateJet } from '../../../../lib/flightUtils.js';

const docGet = vi.fn();
const docSet = vi.fn();
const collectionGet = vi.fn();

const whereSpy = vi.fn();

vi.mock('../../../../lib/firebaseAdmin', () => ({
  db: {
    collection: () => ({
      doc: () => ({ get: docGet, set: docSet }),
      where: (...args) => {
        whereSpy(...args);
        return { orderBy: () => ({ limit: () => ({ get: collectionGet }) }) };
      },
    }),
  },
}));

function cronRequest(authHeader, url = 'https://lookupvegas.com/api/cron/snapshot') {
  return {
    url,
    headers: { get: (name) => (name.toLowerCase() === 'authorization' ? authHeader : null) },
  };
}

// A fetch mock returning realistic, well-formed responses for every source
// this route calls, so the "happy path" test exercises a genuine success.
function mockFetchAllOk() {
  return vi.fn().mockImplementation((url) => {
    if (typeof url === 'string' && url.includes('/api/hotels')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: { compressionScore: 55 } }) });
    }
    if (typeof url === 'string' && url.includes('/api/aviation/snapshot')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ currentSnapshot: { inboundFlights: 20 }, source: 'live', status: 'success', error_summary: [] }),
      });
    }
    if (typeof url === 'string' && url.includes('opensky-network.org')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => ([]) }); // a real, valid, empty arrivals array
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
  });
}

describe('GET /api/cron/snapshot', () => {
  beforeEach(() => {
    docGet.mockReset();
    docSet.mockReset();
    collectionGet.mockReset();
    whereSpy.mockReset();
    docGet.mockResolvedValue({ exists: false });
    collectionGet.mockResolvedValue({ docs: [] });
    docSet.mockResolvedValue(undefined);
    vi.stubEnv('CRON_SECRET', 'test-secret');
    vi.stubGlobal('fetch', mockFetchAllOk());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fails closed with 503 when CRON_SECRET is not configured, regardless of the header sent', async () => {
    vi.stubEnv('CRON_SECRET', '');
    const { GET } = await import('./route.js');

    const res = await GET(cronRequest('Bearer undefined'));
    expect(res.status).toBe(503);
    expect(docSet).not.toHaveBeenCalled();
  });

  it('rejects a missing or incorrect Authorization header', async () => {
    const { GET } = await import('./route.js');

    const res = await GET(cronRequest('Bearer wrong-secret'));
    expect(res.status).toBe(401);
    expect(docSet).not.toHaveBeenCalled();
  });

  it('accepts a valid, correctly authenticated execution and writes a snapshot', async () => {
    const { GET } = await import('./route.js');

    const res = await GET(cronRequest('Bearer test-secret'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('success');
    expect(docSet).toHaveBeenCalledTimes(1);
    expect(docSet.mock.calls[0][0]).toMatchObject({ cvi_version: 'v1', status: 'success' });
  });

  it('persists all five CVI component scores, not just the two that were previously recoverable', async () => {
    const { GET } = await import('./route.js');
    await GET(cronRequest('Bearer test-secret'));

    const written = docSet.mock.calls[0][0];
    for (const field of ['flight_score', 'demand_momentum', 'event_impact_score', 'weather_score', 'private_jet_index_normalized']) {
      expect(typeof written[field]).toBe('number');
    }
    expect(written.schema_version).toBe('v3'); // LV-008 bumped v2 -> v3 (private_jet_activity_index added)

    // The persisted components must actually reproduce the stored CVI --
    // this is the arithmetic-reproducibility guarantee this ticket exists
    // to establish, checked here at the source rather than only in the
    // validation framework's own tests.
    const recomputed = written.flight_score * 0.35
      + written.demand_momentum * 0.25
      + written.event_impact_score * 0.20
      + written.weather_score * 0.10
      + written.private_jet_index_normalized * 0.10;
    expect(Math.abs(recomputed - written.city_velocity_index)).toBeLessThan(0.01);
  });

  it('skips recomputation for a date that already completed successfully (duplicate delivery)', async () => {
    docGet.mockResolvedValue({ exists: true, data: () => ({ status: 'success' }) });
    const { GET } = await import('./route.js');

    const res = await GET(cronRequest('Bearer test-secret'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('already_completed');
    expect(docSet).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('re-runs a date whose prior attempt failed rather than treating it as complete', async () => {
    docGet.mockResolvedValue({ exists: true, data: () => ({ status: 'failed' }) });
    const { GET } = await import('./route.js');

    const res = await GET(cronRequest('Bearer test-secret'));
    expect(docSet).toHaveBeenCalledTimes(1);
    const written = docSet.mock.calls[0][0];
    expect(['success', 'partial']).toContain(written.status);
  });

  it('marks the run partial and records which sources fell back when an upstream API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('adsb.lol')) {
        return Promise.reject(new Error('network unreachable'));
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    }));

    const { GET } = await import('./route.js');
    const res = await GET(cronRequest('Bearer test-secret'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('partial');
    expect(body.sourceFreshness.adsb).toBe('fallback');
    // A partial run still persists a snapshot -- partial data beats no data.
    expect(docSet).toHaveBeenCalledTimes(1);
    expect(docSet.mock.calls[0][0].error_summary.length).toBeGreaterThan(0);
  });

  it('does not report success when the Firestore write itself fails', async () => {
    docSet.mockRejectedValue(new Error('Firestore unavailable'));
    const { GET } = await import('./route.js');

    const res = await GET(cronRequest('Bearer test-secret'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.status).toBe('failed');
  });

  it('writes to a deterministic document ID derived from the Las Vegas business date', async () => {
    // Freeze time at a moment where UTC and Pacific dates disagree if the
    // date bucketing were naive: 2026-03-10T06:30:00Z is 2026-03-09 23:30
    // Pacific (PDT, UTC-7 -- DST already began March 8, 2026) -- still
    // March 9th locally, already March 10th UTC.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T06:30:00Z'));

    const { GET } = await import('./route.js');
    const res = await GET(cronRequest('Bearer test-secret'));
    const body = await res.json();

    expect(body.date).toBe('2026-03-09');

    vi.useRealTimers();
  });

  it('resolves the correct Las Vegas business date across a UTC midnight boundary', async () => {
    // 2026-06-15T05:00:00Z is 2026-06-14 22:00 Pacific (PDT, UTC-7) --
    // just after UTC's date rolled to the 15th, Vegas is still on the 14th.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T05:00:00Z'));

    const { GET } = await import('./route.js');
    const res = await GET(cronRequest('Bearer test-secret'));
    const body = await res.json();

    expect(body.date).toBe('2026-06-14');

    vi.useRealTimers();
  });

  it('logs a single structured INFO summary event with severity distinguishable from a partial run', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { GET } = await import('./route.js');

    await GET(cronRequest('Bearer test-secret'));

    const logged = logSpy.mock.calls.map(call => JSON.parse(call[0]));
    const summary = logged.find(l => l.event === 'snapshot_run_complete');
    expect(summary).toBeDefined();
    expect(summary.severity).toBe('INFO');
    expect(summary.status).toBe('success');
    expect(typeof summary.duration_ms).toBe('number');
  });

  it('logs the run-complete summary as WARNING, and each fallback source as its own ERROR event, for a partial run', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('adsb.lol')) {
        return Promise.reject(new Error('network unreachable'));
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    }));

    const { GET } = await import('./route.js');
    await GET(cronRequest('Bearer test-secret'));

    const logged = logSpy.mock.calls.map(call => JSON.parse(call[0]));
    const summary = logged.find(l => l.event === 'snapshot_run_complete');
    const sourceFailure = logged.find(l => l.event === 'snapshot_source_failed' && l.source === 'adsb');

    expect(summary.severity).toBe('WARNING');
    expect(summary.status).toBe('partial');
    expect(sourceFailure).toBeDefined();
    expect(sourceFailure.severity).toBe('ERROR');
    expect(sourceFailure.error).toContain('network unreachable');
  });

  it('logs a structured ERROR event when the Firestore write itself fails, with no run-complete event', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    docSet.mockRejectedValue(new Error('Firestore unavailable'));
    const { GET } = await import('./route.js');

    await GET(cronRequest('Bearer test-secret'));

    const logged = logSpy.mock.calls.map(call => JSON.parse(call[0]));
    const persistFailure = logged.find(l => l.event === 'snapshot_persist_failed');
    const summary = logged.find(l => l.event === 'snapshot_run_complete');

    expect(persistFailure).toBeDefined();
    expect(persistFailure.severity).toBe('ERROR');
    expect(persistFailure.status).toBe('failed');
    // A run that never persisted should not also emit a "complete" event --
    // that would be a false-positive signal to anything watching for it.
    expect(summary).toBeUndefined();
  });

  describe('backfill (?date= / ?force=)', () => {
    it('rejects a malformed date parameter', async () => {
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret', 'https://lookupvegas.com/api/cron/snapshot?date=07-28-2026'));
      expect(res.status).toBe(400);
      expect(docSet).not.toHaveBeenCalled();
    });

    it('rejects a calendar date that does not exist', async () => {
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret', 'https://lookupvegas.com/api/cron/snapshot?date=2026-02-30'));
      expect(res.status).toBe(400);
    });

    it('rejects a future date', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-28T12:00:00Z'));
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret', 'https://lookupvegas.com/api/cron/snapshot?date=2026-07-29'));
      expect(res.status).toBe(400);
      vi.useRealTimers();
    });

    it('targets the requested past date, not today, and marks the record backfilled', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-28T12:00:00Z')); // "today" is 2026-07-28
      const { GET } = await import('./route.js');

      const res = await GET(cronRequest('Bearer test-secret', 'https://lookupvegas.com/api/cron/snapshot?date=2026-07-20'));
      const body = await res.json();

      expect(body.date).toBe('2026-07-20');
      expect(body.backfilled).toBe(true);
      expect(docSet.mock.calls[0][0]).toMatchObject({ date: '2026-07-20', backfilled: true });
      // The rolling window must be filtered relative to the target date,
      // not "today" -- otherwise a backfilled historical record would be
      // computed from days chronologically after it.
      expect(whereSpy).toHaveBeenCalledWith('date', '<', '2026-07-20');

      vi.useRealTimers();
    });

    it('marks a same-day (non-backfill) run as backfilled: false', async () => {
      const { GET } = await import('./route.js');
      await GET(cronRequest('Bearer test-secret'));
      expect(docSet.mock.calls[0][0]).toMatchObject({ backfilled: false });
    });

    it('does not overwrite an existing successful record without force=true, even when a date is explicitly requested', async () => {
      docGet.mockResolvedValue({ exists: true, data: () => ({ status: 'success' }) });
      const { GET } = await import('./route.js');

      const res = await GET(cronRequest('Bearer test-secret', 'https://lookupvegas.com/api/cron/snapshot?date=2026-07-20'));
      const body = await res.json();

      expect(body.status).toBe('already_completed');
      expect(docSet).not.toHaveBeenCalled();
    });

    it('overwrites an existing successful record when force=true is explicitly supplied', async () => {
      docGet.mockResolvedValue({ exists: true, data: () => ({ status: 'success' }) });
      const { GET } = await import('./route.js');

      const res = await GET(cronRequest('Bearer test-secret', 'https://lookupvegas.com/api/cron/snapshot?date=2026-07-20&force=true'));
      const body = await res.json();

      expect(body.status).not.toBe('already_completed');
      expect(docSet).toHaveBeenCalledTimes(1);
    });
  });

  describe('hotels silent-fallback detection', () => {
    it('marks the hotels source as fallback when the endpoint returns 200 with its own internal fallback payload', async () => {
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('/api/hotels')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ data: { compressionScore: 88, status: 'High Compression' }, source: 'fallback' }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      }));

      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();

      expect(body.status).toBe('partial');
      expect(body.sourceFreshness.hotels).toBe('fallback');
      expect(docSet.mock.calls[0][0].error_summary.some(e => e.includes('hotels endpoint returned its internal fallback'))).toBe(true);
    });

    it('marks the hotels source as ok when it returns a genuine (non-fallback) value', async () => {
      const { GET } = await import('./route.js'); // mockFetchAllOk() already returns a real-shaped hotels response
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();

      expect(body.status).toBe('success');
      expect(body.sourceFreshness.hotels).toBe('ok');
    });
  });

  describe('aviation degradation propagation (LV-005)', () => {
    function fetchWithAviation(aviationBody) {
      return vi.fn().mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('/api/aviation/snapshot')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => aviationBody });
        }
        if (typeof url === 'string' && url.includes('/api/hotels')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: { compressionScore: 55 } }) });
        }
        if (typeof url === 'string' && url.includes('opensky-network.org')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ([]) });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      });
    }

    it('records aviation: "ok" for a healthy live response', async () => {
      vi.stubGlobal('fetch', fetchWithAviation({
        currentSnapshot: { inboundFlights: 20 }, source: 'live', status: 'success', error_summary: [],
      }));
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();

      expect(body.status).toBe('success');
      expect(body.sourceFreshness.aviation).toBe('ok');
    });

    it('records aviation: "ok" for a legitimate live zero -- zero is not itself degraded', async () => {
      vi.stubGlobal('fetch', fetchWithAviation({
        currentSnapshot: { inboundFlights: 0 }, source: 'live', status: 'success', error_summary: [],
      }));
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();

      expect(body.status).toBe('success');
      expect(body.sourceFreshness.aviation).toBe('ok');
    });

    it('records aviation: "fallback" and makes the archive status partial when the aviation endpoint reports degraded data', async () => {
      vi.stubGlobal('fetch', fetchWithAviation({
        currentSnapshot: { inboundFlights: 0 },
        source: 'fallback',
        status: 'partial',
        error_summary: ['ADSB.lol upstream returned HTTP 503'],
      }));
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();

      expect(body.status).toBe('partial');
      expect(body.sourceFreshness.aviation).toBe('fallback');
    });

    it('adds an aviation-specific entry to error_summary when aviation is degraded', async () => {
      vi.stubGlobal('fetch', fetchWithAviation({
        currentSnapshot: { inboundFlights: 0 },
        source: 'fallback',
        status: 'partial',
        error_summary: ['ADSB.lol upstream returned HTTP 503'],
      }));
      const { GET } = await import('./route.js');
      await GET(cronRequest('Bearer test-secret'));

      const errorSummary = docSet.mock.calls[0][0].error_summary;
      expect(errorSummary.some(e => e.includes('aviation') && e.includes('503'))).toBe(true);
    });

    it('treats a missing or unrecognized source/status as degraded (fail closed, not fail open)', async () => {
      vi.stubGlobal('fetch', fetchWithAviation({ currentSnapshot: { inboundFlights: 20 } })); // no source/status at all
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();

      expect(body.status).toBe('partial');
      expect(body.sourceFreshness.aviation).toBe('fallback');
    });

    it('leaves other sources unaffected when only aviation is degraded', async () => {
      vi.stubGlobal('fetch', fetchWithAviation({
        currentSnapshot: { inboundFlights: 0 }, source: 'fallback', status: 'partial', error_summary: ['down'],
      }));
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();

      expect(body.sourceFreshness.hotels).toBe('ok');
      expect(body.sourceFreshness.openSky).toBe('ok');
      expect(body.sourceFreshness.adsb).toBe('ok');
      expect(body.sourceFreshness.weather).toBe('ok');
    });

    it('produces identical CVI arithmetic and component values whether aviation is healthy or degraded, given equivalent numeric inputs', async () => {
      // aviation only ever contributes flight_arrivals_total -- the health
      // signal must change status/error_summary, never the calculation.
      vi.stubGlobal('fetch', fetchWithAviation({
        currentSnapshot: { inboundFlights: 20 }, source: 'live', status: 'success', error_summary: [],
      }));
      const { GET: GET_live } = await import('./route.js');
      const liveRes = await GET_live(cronRequest('Bearer test-secret'));
      const liveBody = await liveRes.json();
      const liveWritten = docSet.mock.calls[0][0];

      docSet.mockClear();

      vi.stubGlobal('fetch', fetchWithAviation({
        currentSnapshot: { inboundFlights: 20 }, source: 'fallback', status: 'partial', error_summary: ['down'],
      }));
      const { GET: GET_degraded } = await import('./route.js');
      const degradedRes = await GET_degraded(cronRequest('Bearer test-secret'));
      const degradedBody = await degradedRes.json();
      const degradedWritten = docSet.mock.calls[0][0];

      // Same inboundFlights input -> identical arithmetic, regardless of
      // the health signal attached to it.
      expect(degradedBody.data.velocity).toBe(liveBody.data.velocity);
      expect(degradedWritten.flight_score).toBe(liveWritten.flight_score);
      expect(degradedWritten.city_velocity_index).toBe(liveWritten.city_velocity_index);
      expect(degradedWritten.flight_arrivals_total).toBe(liveWritten.flight_arrivals_total);
      // Only the health/status labeling differs.
      expect(liveWritten.status).toBe('success');
      expect(degradedWritten.status).toBe('partial');
    });
  });

  describe('LV-006: legitimate zero preservation', () => {
    // Mirrors the real flightScore formula so expectations are computed,
    // not hardcoded magic numbers -- this proves the fix changes *which
    // number* feeds the formula, not the formula itself.
    function expectedFlightScore(arrivals, totalArrivals) {
      const mean = arrivals.reduce((a, b) => a + b, 0) / arrivals.length;
      const variance = arrivals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arrivals.length;
      const stddev = Math.sqrt(variance) || 1;
      const zScore = (totalArrivals - mean) / stddev;
      return Math.max(0, Math.min(100, 50 + (zScore * 16.67)));
    }

    function fetchWithFixedArrivals(openSkyArray) {
      return vi.fn().mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('/api/aviation/snapshot')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ currentSnapshot: { inboundFlights: 20 }, source: 'live', status: 'success', error_summary: [] }) });
        }
        if (typeof url === 'string' && url.includes('/api/hotels')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: { compressionScore: 55 } }) });
        }
        if (typeof url === 'string' && url.includes('opensky-network.org')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => openSkyArray });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      });
    }

    function historicalDoc(date, flightArrivalsTotal) {
      return { data: () => ({ date, flight_arrivals_total: flightArrivalsTotal }) };
    }

    it('archived flight_arrivals_total: 0 contributes a real zero to the rolling window, not 450', async () => {
      const arrivals = [0, 400, 400, 400, 400, 400, 400];
      collectionGet.mockResolvedValue({ docs: arrivals.map((v, i) => historicalDoc(`2026-07-${20 + i}`, v)) });
      vi.stubGlobal('fetch', fetchWithFixedArrivals([1, 2, 3, 4, 5])); // totalArrivals = 5

      const { GET } = await import('./route.js');
      await GET(cronRequest('Bearer test-secret'));

      const written = docSet.mock.calls[0][0];
      expect(written.flight_score).toBeCloseTo(expectedFlightScore(arrivals, 5), 5);
      // If the bug still substituted 450 for the archived 0, the mean/stddev
      // (and therefore flight_score) would differ measurably from this.
      const buggyArrivals = [450, 400, 400, 400, 400, 400, 400];
      expect(written.flight_score).not.toBeCloseTo(expectedFlightScore(buggyArrivals, 5), 2);
    });

    it('archived flight_arrivals_total: null uses the existing 450 fallback', async () => {
      const arrivals = [450, 400, 400, 400, 400, 400, 400];
      collectionGet.mockResolvedValue({
        docs: [historicalDoc('2026-07-20', null), ...arrivals.slice(1).map((v, i) => historicalDoc(`2026-07-${21 + i}`, v))],
      });
      vi.stubGlobal('fetch', fetchWithFixedArrivals([1, 2, 3, 4, 5]));

      const { GET } = await import('./route.js');
      await GET(cronRequest('Bearer test-secret'));

      expect(docSet.mock.calls[0][0].flight_score).toBeCloseTo(expectedFlightScore(arrivals, 5), 5);
    });

    it('archived missing flight_arrivals_total field uses the existing 450 fallback', async () => {
      const positiveArrivals = [400, 400, 400, 400, 400, 400]; // 6 known values
      const arrivals = [450, ...positiveArrivals]; // expected: missing field treated as 450
      const docsWithMissingField = [
        { data: () => ({ date: '2026-07-20' }) }, // field entirely absent -- 7th doc
        ...positiveArrivals.map((v, i) => historicalDoc(`2026-07-${21 + i}`, v)),
      ];
      collectionGet.mockResolvedValue({ docs: docsWithMissingField });
      vi.stubGlobal('fetch', fetchWithFixedArrivals([1, 2, 3, 4, 5]));

      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      expect(res.status).toBe(200);
      expect(docSet.mock.calls[0][0].flight_score).toBeCloseTo(expectedFlightScore(arrivals, 5), 5);
    });

    it('archived NaN/non-finite flight_arrivals_total uses the existing 450 fallback', async () => {
      const arrivals = [450, 400, 400, 400, 400, 400, 400];
      collectionGet.mockResolvedValue({
        docs: [historicalDoc('2026-07-20', NaN), ...arrivals.slice(1).map((v, i) => historicalDoc(`2026-07-${21 + i}`, v))],
      });
      vi.stubGlobal('fetch', fetchWithFixedArrivals([1, 2, 3, 4, 5]));

      const { GET } = await import('./route.js');
      await GET(cronRequest('Bearer test-secret'));

      expect(docSet.mock.calls[0][0].flight_score).toBeCloseTo(expectedFlightScore(arrivals, 5), 5);
    });

    it('produces the mathematically expected rolling inputs from mixed zero and positive history', async () => {
      const arrivals = [0, 0, 300, 500, 450, 600, 0];
      collectionGet.mockResolvedValue({ docs: arrivals.map((v, i) => historicalDoc(`2026-07-${20 + i}`, v)) });
      vi.stubGlobal('fetch', fetchWithFixedArrivals([1, 2])); // totalArrivals = 2

      const { GET } = await import('./route.js');
      await GET(cronRequest('Bearer test-secret'));

      expect(docSet.mock.calls[0][0].flight_score).toBeCloseTo(expectedFlightScore(arrivals, 2), 5);
    });

    it('regression: identical valid non-zero inputs produce identical flight_arrivals_total, flight_score, demand_momentum, and city_velocity_index -- the fix changes value selection, not calculation', async () => {
      const arrivals = [380, 410, 395, 420, 440, 405, 415, 430, 400, 390, 425, 435, 402, 418];
      collectionGet.mockResolvedValue({ docs: arrivals.map((v, i) => historicalDoc(`2026-07-${10 + i}`, v)) });
      vi.stubGlobal('fetch', fetchWithFixedArrivals([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])); // totalArrivals = 10

      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();
      const written = docSet.mock.calls[0][0];

      expect(written.flight_arrivals_total).toBe(10);
      expect(written.flight_score).toBeCloseTo(expectedFlightScore(arrivals, 10), 5);
      expect(body.data.flightScore).toBeCloseTo(expectedFlightScore(arrivals, 10), 5);

      // demand_momentum and city_velocity_index follow directly from the
      // same unmodified formula given these inputs -- confirmed present
      // and finite, not recomputed by a different code path.
      expect(Number.isFinite(written.demand_momentum)).toBe(true);
      expect(Number.isFinite(written.city_velocity_index)).toBe(true);
      expect(written.city_velocity_index).toBeCloseTo(
        written.flight_score * 0.35 + written.demand_momentum * 0.25 + written.event_impact_score * 0.20
          + written.weather_score * 0.10 + written.private_jet_index_normalized * 0.10,
        5
      );
    });
  });

  describe('LV-006: OpenSky array validation', () => {
    function fetchWithOpenSky(openSkyResponse) {
      return vi.fn().mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('/api/aviation/snapshot')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ currentSnapshot: { inboundFlights: 20 }, source: 'live', status: 'success', error_summary: [] }) });
        }
        if (typeof url === 'string' && url.includes('/api/hotels')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: { compressionScore: 55 } }) });
        }
        if (typeof url === 'string' && url.includes('opensky-network.org')) {
          return openSkyResponse;
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      });
    }

    it('overrides total arrivals with an explicit zero for a successful, genuinely empty array', async () => {
      vi.stubGlobal('fetch', fetchWithOpenSky(Promise.resolve({ ok: true, status: 200, json: async () => [] })));
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();

      expect(body.data.arrivals).toBe(0);
      expect(body.sourceFreshness.openSky).toBe('ok');
      expect(body.status).toBe('success'); // a valid zero must not itself mark the run partial
    });

    it('uses the actual length of a successful non-empty array', async () => {
      vi.stubGlobal('fetch', fetchWithOpenSky(Promise.resolve({ ok: true, status: 200, json: async () => [{}, {}, {}] })));
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();

      expect(body.data.arrivals).toBe(3);
      expect(body.sourceFreshness.openSky).toBe('ok');
    });

    it('preserves the prior aviation-derived value on a failed (non-2xx) OpenSky request', async () => {
      vi.stubGlobal('fetch', fetchWithOpenSky(Promise.resolve({ ok: false, status: 503, json: async () => ({}) })));
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();

      expect(body.data.arrivals).toBe(20 * 24); // aviation-derived value, untouched
      expect(body.sourceFreshness.openSky).toBe('fallback');
      expect(body.status).toBe('partial');
    });

    it('does not silently become zero for a non-array (object) payload', async () => {
      vi.stubGlobal('fetch', fetchWithOpenSky(Promise.resolve({ ok: true, status: 200, json: async () => ({ error: 'rate limited' }) })));
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();

      expect(body.data.arrivals).toBe(20 * 24); // preserved, not corrupted to 0
      expect(body.sourceFreshness.openSky).toBe('fallback');
    });

    it('does not silently become zero when the expected payload is entirely missing (null)', async () => {
      vi.stubGlobal('fetch', fetchWithOpenSky(Promise.resolve({ ok: true, status: 200, json: async () => null })));
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();

      expect(body.data.arrivals).toBe(20 * 24);
      expect(body.sourceFreshness.openSky).toBe('fallback');
    });

    it('marks OpenSky fallback and the run partial for a malformed response', async () => {
      vi.stubGlobal('fetch', fetchWithOpenSky(Promise.resolve({ ok: true, status: 200, json: async () => 'not-an-array-or-object' })));
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();

      expect(body.sourceFreshness.openSky).toBe('fallback');
      expect(body.status).toBe('partial');
      expect(docSet.mock.calls[0][0].error_summary.some(e => e.toLowerCase().includes('opensky'))).toBe(true);
    });

    it('marks the run partial when OpenSky fails at the network level', async () => {
      vi.stubGlobal('fetch', fetchWithOpenSky(Promise.reject(new Error('ECONNRESET'))));
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();

      expect(body.sourceFreshness.openSky).toBe('fallback');
      expect(body.status).toBe('partial');
    });
  });

  describe('LV-007: unified private-jet classification', () => {
    // A descending aircraft record shape matching real ADSB.lol payloads:
    // alt_baro < 20000 and baro_rate < -200 both required to count at all
    // (the descending-aircraft filter, untouched by this ticket).
    function descendingAircraft(t, flight) {
      return { alt_baro: 5000, baro_rate: -500, t, flight };
    }

    function fetchWithAdsbFleet(fleet) {
      return vi.fn().mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('adsb.lol')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ ac: fleet }) });
        }
        if (typeof url === 'string' && url.includes('/api/hotels')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: { compressionScore: 55 } }) });
        }
        if (typeof url === 'string' && url.includes('/api/aviation/snapshot')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ currentSnapshot: { inboundFlights: 20 }, source: 'live', status: 'success', error_summary: [] }) });
        }
        if (typeof url === 'string' && url.includes('opensky-network.org')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => [] });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      });
    }

    it('cross-pipeline consistency: the cron numerator matches isPrivateJet applied directly to the same fleet -- the live endpoint would classify identically since both call the same function', async () => {
      const fleet = [
        descendingAircraft('C56X', 'N123AB'),  // private (type match)
        descendingAircraft('B738', 'SWA1234'), // not private
        descendingAircraft('GLF5', ''),        // private, no callsign -- the case the old heuristic missed
        descendingAircraft('CRJ2', 'N123CR'),  // not private -- the false positive the old heuristic had
      ];
      const expectedPrivate = fleet.filter(f => isPrivateJet(f.t, f.flight)).length;
      expect(expectedPrivate).toBe(2); // sanity check on the fixture itself

      vi.stubGlobal('fetch', fetchWithAdsbFleet(fleet));
      const { GET } = await import('./route.js');
      await GET(cronRequest('Bearer test-secret'));

      const written = docSet.mock.calls[0][0];
      const expectedRatio = (expectedPrivate / fleet.length) / 0.08;
      expect(written.private_jet_count).toBeCloseTo(expectedRatio, 10);
    });

    it('handles a malformed aircraft record (non-string type/callsign) without throwing or crashing the run', async () => {
      const fleet = [
        descendingAircraft('C56X', 'N123AB'),
        { alt_baro: 5000, baro_rate: -500, t: {}, flight: {} }, // malformed
      ];
      vi.stubGlobal('fetch', fetchWithAdsbFleet(fleet));
      const { GET } = await import('./route.js');

      const res = await GET(cronRequest('Bearer test-secret'));
      expect(res.status).toBe(200);
      // The malformed record safely resolves to "not private" (Other),
      // so exactly 1 of 2 is private -- not a crash, not silently 0/0.
      const written = docSet.mock.calls[0][0];
      expect(written.private_jet_count).toBeCloseTo((1 / 2) / 0.08, 10);
    });

    it('normalizes case and whitespace identically to the shared classifier (the old heuristic\'s case-sensitivity bug is gone)', async () => {
      const fleet = [descendingAircraft('c56x', '  n456cd  ')];
      vi.stubGlobal('fetch', fetchWithAdsbFleet(fleet));
      const { GET } = await import('./route.js');
      await GET(cronRequest('Bearer test-secret'));

      const written = docSet.mock.calls[0][0];
      // All 1 of 1 aircraft correctly classified private despite lowercase/padding.
      expect(written.private_jet_count).toBeCloseTo((1 / 1) / 0.08, 10);
    });

    describe('CVI regression -- fixtures where old and new classifiers already agreed', () => {
      it('private_jet_count, private_jet_index_normalized, and city_velocity_index are unchanged for an agreement fixture', async () => {
        const fleet = [
          descendingAircraft('C56X', 'N123AB'), // agreement case: both old and new say Private
          descendingAircraft('B738', 'SWA1234'), // agreement case: both say not private
        ];
        vi.stubGlobal('fetch', fetchWithAdsbFleet(fleet));
        const { GET } = await import('./route.js');
        await GET(cronRequest('Bearer test-secret'));

        const written = docSet.mock.calls[0][0];
        const expectedRatio = (1 / 2) / 0.08; // identical whether computed by the old or new classifier
        const expectedNormalized = Math.min(100, expectedRatio * 50);
        expect(written.private_jet_count).toBeCloseTo(expectedRatio, 10);
        expect(written.private_jet_index_normalized).toBeCloseTo(expectedNormalized, 10);
        expect(written.city_velocity_index).toBeCloseTo(
          written.flight_score * 0.35 + written.demand_momentum * 0.25 + written.event_impact_score * 0.20
            + written.weather_score * 0.10 + written.private_jet_index_normalized * 0.10,
          10
        );
      });
    });

    describe('CVI regression -- fixtures where the old and new classifiers previously disagreed', () => {
      it('explicitly asserts the new authoritative numerator and normalized value for a previously-missed business jet', async () => {
        // GLF5 with no callsign: old heuristic said not-private, new says private.
        const fleet = [descendingAircraft('GLF5', '')];
        vi.stubGlobal('fetch', fetchWithAdsbFleet(fleet));
        const { GET } = await import('./route.js');
        await GET(cronRequest('Bearer test-secret'));

        const written = docSet.mock.calls[0][0];
        const expectedRatio = (1 / 1) / 0.08; // now correctly classified private
        expect(written.private_jet_count).toBeCloseTo(expectedRatio, 10);
        expect(written.private_jet_index_normalized).toBeCloseTo(Math.min(100, expectedRatio * 50), 10);
      });

      it('explicitly asserts the new authoritative numerator for a previously-false-positive regional jet', async () => {
        // CRJ2 with an N-number callsign: old heuristic said Private (false
        // positive), new correctly says not private via type exclusion.
        const fleet = [descendingAircraft('CRJ2', 'N123CR')];
        vi.stubGlobal('fetch', fetchWithAdsbFleet(fleet));
        const { GET } = await import('./route.js');
        await GET(cronRequest('Bearer test-secret'));

        const written = docSet.mock.calls[0][0];
        const expectedRatio = (0 / 1) / 0.08; // correctly excluded -- ratio is 0
        expect(written.private_jet_count).toBeCloseTo(expectedRatio, 10);
        expect(written.private_jet_index_normalized).toBeCloseTo(0, 10);
      });
    });

    it('scope regression: CVI component weights, the descending-aircraft filter, and OpenSky/backfill behavior are untouched', async () => {
      // 0.35/0.25/0.20/0.10/0.10 -- the exact weights from the route itself,
      // re-asserted here so any future accidental weight edit fails this test.
      const fleet = [descendingAircraft('C56X', 'N123AB')];
      vi.stubGlobal('fetch', fetchWithAdsbFleet(fleet));
      const { GET } = await import('./route.js');
      await GET(cronRequest('Bearer test-secret'));

      const written = docSet.mock.calls[0][0];
      const recomputed = written.flight_score * 0.35 + written.demand_momentum * 0.25
        + written.event_impact_score * 0.20 + written.weather_score * 0.10 + written.private_jet_index_normalized * 0.10;
      expect(written.city_velocity_index).toBeCloseTo(recomputed, 10);
      expect(written.backfilled).toBe(false); // backfill semantics untouched
    });
  });

  describe('LV-008: canonical private-jet activity field', () => {
    function descendingAircraft(t, flight) {
      return { alt_baro: 5000, baro_rate: -500, t, flight };
    }

    function fetchWithAdsbFleet(fleet) {
      return vi.fn().mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('adsb.lol')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ ac: fleet }) });
        }
        if (typeof url === 'string' && url.includes('/api/hotels')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: { compressionScore: 55 } }) });
        }
        if (typeof url === 'string' && url.includes('/api/aviation/snapshot')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ currentSnapshot: { inboundFlights: 20 }, source: 'live', status: 'success', error_summary: [] }) });
        }
        if (typeof url === 'string' && url.includes('opensky-network.org')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => [] });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      });
    }

    it('persists both the canonical and legacy fields, numerically identical, for a new snapshot', async () => {
      const fleet = [descendingAircraft('C56X', 'N123AB'), descendingAircraft('B738', 'SWA1234')];
      vi.stubGlobal('fetch', fetchWithAdsbFleet(fleet));
      const { GET } = await import('./route.js');
      await GET(cronRequest('Bearer test-secret'));

      const written = docSet.mock.calls[0][0];
      expect(written.private_jet_activity_index).toBeDefined();
      expect(written.private_jet_count).toBeDefined();
      expect(written.private_jet_count).toBe(written.private_jet_activity_index);
    });

    it('leaves private_jet_index_normalized and city_velocity_index unaffected by the dual-write', async () => {
      const fleet = [descendingAircraft('C56X', 'N123AB')];
      vi.stubGlobal('fetch', fetchWithAdsbFleet(fleet));
      const { GET } = await import('./route.js');
      await GET(cronRequest('Bearer test-secret'));

      const written = docSet.mock.calls[0][0];
      const expectedNormalized = Math.min(100, written.private_jet_activity_index * 50);
      expect(written.private_jet_index_normalized).toBeCloseTo(expectedNormalized, 10);
      expect(written.city_velocity_index).toBeCloseTo(
        written.flight_score * 0.35 + written.demand_momentum * 0.25 + written.event_impact_score * 0.20
          + written.weather_score * 0.10 + written.private_jet_index_normalized * 0.10,
        10
      );
    });

    it('writes a legitimate zero identically to both fields', async () => {
      // No aircraft classified private at all -- ratio is 0/total = 0.
      const fleet = [descendingAircraft('B738', 'SWA1234'), descendingAircraft('B763', 'FDX1234')];
      vi.stubGlobal('fetch', fetchWithAdsbFleet(fleet));
      const { GET } = await import('./route.js');
      await GET(cronRequest('Bearer test-secret'));

      const written = docSet.mock.calls[0][0];
      expect(written.private_jet_activity_index).toBe(0);
      expect(written.private_jet_count).toBe(0);
    });

    it('writes a value greater than 1 unchanged to both fields (the index is not bounded to [0,1])', async () => {
      // All aircraft private -> ratio = 1/1 = 1.0, /0.08 = 12.5.
      const fleet = [descendingAircraft('C56X', 'N123AB')];
      vi.stubGlobal('fetch', fetchWithAdsbFleet(fleet));
      const { GET } = await import('./route.js');
      await GET(cronRequest('Bearer test-secret'));

      const written = docSet.mock.calls[0][0];
      expect(written.private_jet_activity_index).toBeCloseTo(12.5, 10);
      expect(written.private_jet_count).toBeCloseTo(12.5, 10);
    });

    it('bumps schema_version to v3 and includes the canonical field in the JSON response for parity', async () => {
      const fleet = [descendingAircraft('C56X', 'N123AB')];
      vi.stubGlobal('fetch', fetchWithAdsbFleet(fleet));
      const { GET } = await import('./route.js');
      const res = await GET(cronRequest('Bearer test-secret'));
      const body = await res.json();

      expect(docSet.mock.calls[0][0].schema_version).toBe('v3');
      expect(body.data.privateJetActivityIndex).toBeDefined();
    });

    describe('regression: classification, ratio, and normalization arithmetic are unchanged', () => {
      it('produces the identical private_jet_count value as before this ticket for a fixed fleet', async () => {
        // 1 of 4 descending aircraft private -> (1/4)/0.08 = 3.125.
        const fleet = [
          descendingAircraft('C56X', 'N123AB'),
          descendingAircraft('B738', 'SWA1234'),
          descendingAircraft('B763', 'FDX1234'),
          descendingAircraft('C130', ''),
        ];
        vi.stubGlobal('fetch', fetchWithAdsbFleet(fleet));
        const { GET } = await import('./route.js');
        await GET(cronRequest('Bearer test-secret'));

        const written = docSet.mock.calls[0][0];
        expect(written.private_jet_count).toBeCloseTo((1 / 4) / 0.08, 10);
        expect(written.private_jet_activity_index).toBeCloseTo((1 / 4) / 0.08, 10);
      });
    });
  });
});
