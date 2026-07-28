import { describe, it, expect, vi, afterEach } from 'vitest';
import { findNonFiniteFields } from './route.js';

function mockFetchFor({ adsb, weather } = {}) {
  return vi.fn().mockImplementation((url) => {
    if (typeof url === 'string' && url.includes('adsb.lol')) {
      if (adsb === undefined) return Promise.resolve({ ok: true, status: 200, json: async () => ({ ac: [] }) });
      return adsb;
    }
    if (typeof url === 'string' && url.includes('open-meteo.com')) {
      if (weather === undefined) return Promise.resolve({ ok: true, status: 200, json: async () => ({ current: { temperature_2m: 85, wind_speed_10m: 5, precipitation: 0 } }) });
      return weather;
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
  });
}

function realisticAircraft() {
  // One descending commercial-shaped aircraft, one descending private-jet-
  // shaped aircraft (N-number callsign), one climbing aircraft (outbound).
  return [
    { flight: 'DAL123 ', t: 'B738', alt_baro: 8000, baro_rate: -500 },
    { flight: 'N12AB ', t: 'C56X', alt_baro: 6000, baro_rate: -400 },
    { flight: 'SWA456', t: 'B737', alt_baro: 9000, baro_rate: 600 },
  ];
}

describe('GET /api/aviation/snapshot', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns a healthy live response with all existing fields present', async () => {
    vi.stubGlobal('fetch', mockFetchFor({
      adsb: Promise.resolve({ ok: true, status: 200, json: async () => ({ ac: realisticAircraft() }) }),
    }));
    const { GET } = await import('./route.js');

    const res = await GET({});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.source).toBe('live');
    expect(body.status).toBe('success');
    expect(body.error_summary).toEqual([]);
    // Existing fields, unchanged shape.
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('dataSource');
    expect(body).toHaveProperty('refreshRate');
    expect(body).toHaveProperty('currentSnapshot');
    expect(body).toHaveProperty('weather');
    expect(body).toHaveProperty('stakeholderInsights');
    expect(body).toHaveProperty('dataProvenance');
    expect(body.currentSnapshot.inboundFlights).toBe(2);
    expect(body.currentSnapshot.outboundFlights).toBe(1);
  });

  it('treats a genuinely empty sky as live success, not a failure', async () => {
    vi.stubGlobal('fetch', mockFetchFor({
      adsb: Promise.resolve({ ok: true, status: 200, json: async () => ({ ac: [] }) }),
    }));
    const { GET } = await import('./route.js');

    const res = await GET({});
    const body = await res.json();

    expect(body.source).toBe('live');
    expect(body.status).toBe('success');
    expect(body.currentSnapshot.inboundFlights).toBe(0);
  });

  it('marks a network-level ADSB.lol rejection as fallback, with a sanitized reason', async () => {
    vi.stubGlobal('fetch', mockFetchFor({
      adsb: Promise.reject(new Error('getaddrinfo ENOTFOUND api.adsb.lol')),
    }));
    const { GET } = await import('./route.js');

    const res = await GET({});
    const body = await res.json();

    expect(body.source).toBe('fallback');
    expect(body.status).toBe('partial');
    expect(body.error_summary.length).toBeGreaterThan(0);
    expect(body.error_summary[0]).toContain('ENOTFOUND');
    expect(body.currentSnapshot.inboundFlights).toBe(0); // safe fallback zero, still returned
  });

  it('marks a non-2xx ADSB.lol response as fallback while still returning HTTP 200 (existing UI-safe behavior preserved)', async () => {
    vi.stubGlobal('fetch', mockFetchFor({
      adsb: Promise.resolve({ ok: false, status: 503, json: async () => ({}) }),
    }));
    const { GET } = await import('./route.js');

    const res = await GET({});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.source).toBe('fallback');
    expect(body.status).toBe('partial');
    expect(body.error_summary.some(e => e.includes('503'))).toBe(true);
  });

  it('treats a malformed payload (missing "ac" array) as fallback, not as zero aircraft', async () => {
    vi.stubGlobal('fetch', mockFetchFor({
      adsb: Promise.resolve({ ok: true, status: 200, json: async () => ({ notAircraft: true }) }),
    }));
    const { GET } = await import('./route.js');

    const res = await GET({});
    const body = await res.json();

    expect(body.source).toBe('fallback');
    expect(body.status).toBe('partial');
    expect(body.error_summary.some(e => e.toLowerCase().includes('ac'))).toBe(true);
  });

  it('treats malformed (non-JSON) upstream body as fallback', async () => {
    vi.stubGlobal('fetch', mockFetchFor({
      adsb: Promise.resolve({ ok: true, status: 200, json: async () => { throw new Error('Unexpected token < in JSON'); } }),
    }));
    const { GET } = await import('./route.js');

    const res = await GET({});
    const body = await res.json();

    expect(body.source).toBe('fallback');
    expect(body.status).toBe('partial');
    expect(body.error_summary.some(e => e.includes('Unexpected token'))).toBe(true);
  });

  it('never leaks a stack trace or raw payload in the error summary', async () => {
    const err = new Error('boom');
    err.stack = 'Error: boom\n    at Object.<anonymous> (/very/secret/internal/path.js:42:17)';
    vi.stubGlobal('fetch', mockFetchFor({ adsb: Promise.reject(err) }));
    const { GET } = await import('./route.js');

    const res = await GET({});
    const body = await res.json();

    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('/very/secret/internal/path.js');
    expect(serialized).not.toContain('at Object.<anonymous>');
  });

  it('returns a sanitized fallback body (not a bare stack trace) when the whole handler throws unexpectedly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      throw new Error('totally unexpected synchronous failure');
    }));
    const { GET } = await import('./route.js');

    const res = await GET({});
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.source).toBe('fallback');
    expect(body.status).toBe('partial');
    expect(body.error).toBe('totally unexpected synchronous failure');
  });

  it('confirms every finite computed field is unaffected by the pipeline today', async () => {
    // Every division in lib/flightUtils.js already guards its zero case,
    // so no realistic (or even deliberately malformed-but-typed) input
    // reaches a non-finite computed field through the live route --
    // findNonFiniteFields is tested directly below instead of asserting a
    // route-level scenario that cannot actually occur right now.
    vi.stubGlobal('fetch', mockFetchFor({
      adsb: Promise.resolve({ ok: true, status: 200, json: async () => ({ ac: realisticAircraft() }) }),
    }));
    const { GET } = await import('./route.js');

    const res = await GET({});
    const body = await res.json();
    const counts = body.currentSnapshot;

    expect(findNonFiniteFields({
      inboundFlights: counts.inboundFlights,
      outboundFlights: counts.outboundFlights,
      arrivalRatePerHour: counts.arrivalRatePerHour,
      estimatedDailyPax: counts.estimatedDailyPax,
    })).toEqual([]);
  });
});

describe('findNonFiniteFields', () => {
  it('returns an empty list when every field is a finite number', () => {
    expect(findNonFiniteFields({ a: 1, b: 0, c: -5.5 })).toEqual([]);
  });

  it('flags NaN, Infinity, and non-numeric values by name', () => {
    expect(findNonFiniteFields({ a: 1, b: NaN, c: Infinity, d: 'oops', e: null })).toEqual(['b', 'c', 'd', 'e']);
  });
});
