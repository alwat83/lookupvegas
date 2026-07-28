import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const docGet = vi.fn();

vi.mock('../../../../../lib/firebaseAdmin', () => ({
  db: {
    collection: () => ({ doc: () => ({ get: docGet }) }),
  },
}));

function statusRequest(authHeader) {
  return {
    headers: { get: (name) => (name.toLowerCase() === 'authorization' ? authHeader : null) },
  };
}

describe('GET /api/cron/snapshot/status', () => {
  beforeEach(() => {
    docGet.mockReset();
    vi.stubEnv('CRON_SECRET', 'test-secret');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fails closed with 503 when CRON_SECRET is not configured', async () => {
    vi.stubEnv('CRON_SECRET', '');
    const { GET } = await import('./route.js');

    const res = await GET(statusRequest('Bearer anything'));
    expect(res.status).toBe(503);
  });

  it('rejects an unauthenticated request', async () => {
    const { GET } = await import('./route.js');
    const res = await GET(statusRequest('Bearer wrong'));
    expect(res.status).toBe(401);
  });

  it('reports healthy/success for a completed, on-time, clean run', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T08:00:00Z')); // 01:00 Pacific -- window has passed
    docGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'success',
        timestamp: '2026-07-28T07:07:00.000Z', // 00:07 Pacific -- inside the window
        execution_duration_ms: 4200,
        source_freshness: { aviation: 'ok' },
        error_summary: [],
      }),
    });
    const { GET } = await import('./route.js');

    const res = await GET(statusRequest('Bearer test-secret'));
    const body = await res.json();

    expect(body.exists).toBe(true);
    expect(body.healthy).toBe(true);
    expect(body.reason).toBe('success');
    expect(body.isPartial).toBe(false);
    expect(body.withinExpectedWindow).toBe(true);
  });

  it('reports healthy but degraded for a partial run', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T08:00:00Z'));
    docGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'partial',
        timestamp: '2026-07-28T07:10:00.000Z',
        source_freshness: { weather: 'fallback' },
        error_summary: ['weather fetch failed: timeout'],
      }),
    });
    const { GET } = await import('./route.js');

    const res = await GET(statusRequest('Bearer test-secret'));
    const body = await res.json();

    expect(body.healthy).toBe(true);
    expect(body.reason).toBe('partial');
    expect(body.isPartial).toBe(true);
  });

  it('reports unhealthy for a failed run', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T08:00:00Z'));
    docGet.mockResolvedValue({
      exists: true,
      data: () => ({ status: 'failed', timestamp: '2026-07-28T07:06:00.000Z' }),
    });
    const { GET } = await import('./route.js');

    const res = await GET(statusRequest('Bearer test-secret'));
    const body = await res.json();

    expect(body.healthy).toBe(false);
    expect(body.reason).toBe('failed');
  });

  it('reports pending (not unhealthy) when the window has not yet passed and no record exists', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T07:10:00.000Z')); // 00:10 Pacific -- still inside the window
    docGet.mockResolvedValue({ exists: false });
    const { GET } = await import('./route.js');

    const res = await GET(statusRequest('Bearer test-secret'));
    const body = await res.json();

    expect(body.exists).toBe(false);
    expect(body.healthy).toBeNull();
    expect(body.reason).toBe('pending');
  });

  it('reports missing/unhealthy when the window has passed and no record exists', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T09:00:00.000Z')); // 02:00 Pacific -- well past the window
    docGet.mockResolvedValue({ exists: false });
    const { GET } = await import('./route.js');

    const res = await GET(statusRequest('Bearer test-secret'));
    const body = await res.json();

    expect(body.exists).toBe(false);
    expect(body.healthy).toBe(false);
    expect(body.reason).toBe('missing');
  });

  it('reports unhealthy/late for a record whose own execution time fell outside the window, even though it exists', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00.000Z')); // 05:00 Pacific
    docGet.mockResolvedValue({
      exists: true,
      data: () => ({ status: 'success', timestamp: '2026-07-28T09:45:00.000Z' }), // 02:45 Pacific -- a very late retry
    });
    const { GET } = await import('./route.js');

    const res = await GET(statusRequest('Bearer test-secret'));
    const body = await res.json();

    expect(body.exists).toBe(true);
    expect(body.withinExpectedWindow).toBe(false);
    expect(body.healthy).toBe(false);
    expect(body.reason).toBe('late');
  });
});
