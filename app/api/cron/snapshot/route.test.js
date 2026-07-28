import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const docGet = vi.fn();
const docSet = vi.fn();
const collectionGet = vi.fn();

vi.mock('../../../../lib/firebaseAdmin', () => ({
  db: {
    collection: () => ({
      doc: () => ({ get: docGet, set: docSet }),
      orderBy: () => ({ limit: () => ({ get: collectionGet }) }),
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
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ currentSnapshot: { inboundFlights: 20 } }) });
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
  });
}

describe('GET /api/cron/snapshot', () => {
  beforeEach(() => {
    docGet.mockReset();
    docSet.mockReset();
    collectionGet.mockReset();
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
});
