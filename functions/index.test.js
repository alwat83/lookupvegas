import { describe, it, expect, vi, afterEach } from 'vitest';

// functions/index.js requires "resend" at module scope, and its
// constructor validates that an API key string is present. It is never
// otherwise touched by runDailySnapshot, so a syntactically-plausible
// dummy value is enough to let the module load without needing a real
// Resend account. (admin.initializeApp() at module scope does not throw
// without credentials -- it fails lazily, only on an actual Firestore
// call, which runDailySnapshot never makes either.)
vi.stubEnv('RESEND_API_KEY', 're_test_dummy_key_for_module_load_only');

const { runDailySnapshot, runWeeklyMovementBrief, weeklyMovementBrief } = await import('./index.js');

describe('runDailySnapshot', () => {
  const targetUrl = 'https://lookupvegas.com/api/cron/snapshot';

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('throws without calling fetch when the secret is missing', async () => {
    const fetchImpl = vi.fn();
    await expect(runDailySnapshot(undefined, targetUrl, fetchImpl)).rejects.toThrow('CRON_SECRET not configured');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('throws without calling fetch when the target URL is missing', async () => {
    const fetchImpl = vi.fn();
    await expect(runDailySnapshot('secret', undefined, fetchImpl)).rejects.toThrow('CRON_TARGET_URL not configured');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('calls the snapshot endpoint with a Bearer-authenticated request', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ date: '2026-07-28', status: 'success' }),
    });

    const result = await runDailySnapshot('my-secret', targetUrl, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(targetUrl, expect.objectContaining({
      method: 'GET',
      headers: { Authorization: 'Bearer my-secret' },
    }));
    expect(result.status).toBe('success');
  });

  it('throws (so Cloud Scheduler retries) when the endpoint returns a non-2xx status', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    });

    await expect(runDailySnapshot('wrong-secret', targetUrl, fetchImpl)).rejects.toThrow('status 401');
  });

  it('throws when the endpoint reports a failed run even with a 200 response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'failed', date: '2026-07-28' }),
    });

    await expect(runDailySnapshot('secret', targetUrl, fetchImpl)).rejects.toThrow('reported a failed status');
  });

  it('resolves without throwing for a partial run -- stale sources warrant alerting, not a retry', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'partial', date: '2026-07-28', sourceFreshness: { weather: 'fallback' } }),
    });

    await expect(runDailySnapshot('secret', targetUrl, fetchImpl)).resolves.toMatchObject({ status: 'partial' });
  });

  it('propagates a network-level fetch failure as a rejection', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(runDailySnapshot('secret', targetUrl, fetchImpl)).rejects.toThrow('ECONNREFUSED');
  });

  it('treats a request that never resolves as a distinct timeout, not a generic failure', async () => {
    vi.useFakeTimers();
    // Mimics real fetch's behavior of rejecting with an AbortError once its
    // signal fires, rather than resolving or hanging forever.
    const fetchImpl = vi.fn().mockImplementation((url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        reject(err);
      });
    }));

    const pending = expect(runDailySnapshot('secret', targetUrl, fetchImpl)).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(90_000);
    await pending;
  });

  it('logs a structured JSON entry with severity and context on a failed run', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'failed', date: '2026-07-28' }),
    });

    await expect(runDailySnapshot('secret', targetUrl, fetchImpl)).rejects.toThrow();

    const logged = logSpy.mock.calls.map(call => JSON.parse(call[0]));
    const failureLog = logged.find(l => l.event === 'dailySnapshot_invocation_failed');
    expect(failureLog).toBeDefined();
    expect(failureLog.severity).toBe('ERROR');
    expect(failureLog.snapshot_date).toBe('2026-07-28');
    expect(failureLog.status).toBe('failed');
  });

  it('logs a structured WARNING (not ERROR) for a partial run', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'partial', date: '2026-07-28' }),
    });

    await runDailySnapshot('secret', targetUrl, fetchImpl);

    const logged = logSpy.mock.calls.map(call => JSON.parse(call[0]));
    const runLog = logged.find(l => l.event === 'dailySnapshot_run_complete');
    expect(runLog.severity).toBe('WARNING');
    expect(runLog.status).toBe('partial');
  });
});

describe('weeklyMovementBrief scheduler configuration (LV-009)', () => {
  it('declares an explicit America/Los_Angeles timezone', () => {
    expect(weeklyMovementBrief.__endpoint.scheduleTrigger.timeZone).toBe('America/Los_Angeles');
  });

  it('leaves the intended schedule expression unchanged', () => {
    expect(weeklyMovementBrief.__endpoint.scheduleTrigger.schedule).toBe('every monday 08:00');
  });
});

describe('runWeeklyMovementBrief (LV-009)', () => {
  function chainableSnapshot(result) {
    const obj = {
      where: () => obj,
      orderBy: () => obj,
      limit: () => obj,
      get: async () => result,
    };
    return obj;
  }

  function dailyMetricsSnapshot(docs) {
    return {
      empty: docs.length === 0,
      forEach: (cb) => docs.forEach(d => cb({ data: () => d })),
    };
  }

  function makeDbClient({ dailyMetricsDocs = [], intelligenceUsers = [], enterpriseUsers = [], whereSpy } = {}) {
    return {
      collection: (name) => {
        if (name === 'daily_metrics') {
          const chain = chainableSnapshot(dailyMetricsSnapshot(dailyMetricsDocs));
          if (whereSpy) {
            const originalWhere = chain.where;
            chain.where = (...args) => { whereSpy(...args); return originalWhere(...args); };
          }
          return chain;
        }
        if (name === 'users') {
          return {
            where: (field, op, value) => {
              const docs = value === 'Intelligence' ? intelligenceUsers : value === 'Enterprise' ? enterpriseUsers : [];
              return { get: async () => ({ forEach: (cb) => docs.forEach(d => cb({ data: () => d })) }) };
            },
          };
        }
        throw new Error(`Unexpected collection: ${name}`);
      },
    };
  }

  function makeResendClient() {
    return { emails: { send: vi.fn().mockResolvedValue({ id: 'test' }) } };
  }

  const weekDoc = (date, cvi, compression) => ({ date, city_velocity_index: cvi, hotel_compression_score: compression });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('queries the explicit, inclusive date range derived from the Las Vegas business date, not an implicit "last 7"', async () => {
    const whereSpy = vi.fn();
    const dbClient = makeDbClient({
      dailyMetricsDocs: [weekDoc('2026-07-20', 60, 50)],
      intelligenceUsers: [{ email: 'a@example.com' }],
      whereSpy,
    });
    const resendClient = makeResendClient();

    // Monday 2026-07-20 08:00 Pacific (PDT) -> 2026-07-20T15:00:00Z.
    await runWeeklyMovementBrief(dbClient, resendClient, new Date('2026-07-20T15:00:00Z'));

    expect(whereSpy).toHaveBeenCalledWith('date', '>=', '2026-07-14');
    expect(whereSpy).toHaveBeenCalledWith('date', '<=', '2026-07-20');
  });

  it('regression: a normal, gap-free week selects the same 7 documents, aggregate, and recipients as before', async () => {
    const docs = ['2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19', '2026-07-20']
      .map((date, i) => weekDoc(date, 50 + i, 40 + i));
    const dbClient = makeDbClient({
      dailyMetricsDocs: docs,
      intelligenceUsers: [{ email: 'intel@example.com' }],
      enterpriseUsers: [{ email: 'ent@example.com' }],
    });
    const resendClient = makeResendClient();

    await runWeeklyMovementBrief(dbClient, resendClient, new Date('2026-07-20T15:00:00Z'));

    expect(resendClient.emails.send).toHaveBeenCalledTimes(1);
    const sendCall = resendClient.emails.send.mock.calls[0][0];
    expect(sendCall.bcc).toEqual(['intel@example.com', 'ent@example.com']);
    const expectedAvgCvi = docs.reduce((acc, d) => acc + d.city_velocity_index, 0) / docs.length;
    expect(sendCall.html).toContain(expectedAvgCvi.toFixed(1));
    // Per-row date labels still come from the stored business-date string,
    // not a re-derived UTC label -- unchanged by this ticket.
    expect(sendCall.html).toContain('2026-07-14');
    expect(sendCall.html).toContain('2026-07-20');
  });

  it('sends no email and logs a skip when no documents fall inside the window', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const dbClient = makeDbClient({ dailyMetricsDocs: [] });
    const resendClient = makeResendClient();

    await runWeeklyMovementBrief(dbClient, resendClient, new Date('2026-07-20T15:00:00Z'));

    expect(resendClient.emails.send).not.toHaveBeenCalled();
    const logged = logSpy.mock.calls.map(call => JSON.parse(call[0]));
    expect(logged.find(l => l.event === 'weeklyBrief_no_data')).toBeDefined();
  });

  it('sends no email and logs a skip when no premium recipients exist', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const dbClient = makeDbClient({ dailyMetricsDocs: [weekDoc('2026-07-20', 60, 50)] });
    const resendClient = makeResendClient();

    await runWeeklyMovementBrief(dbClient, resendClient, new Date('2026-07-20T15:00:00Z'));

    expect(resendClient.emails.send).not.toHaveBeenCalled();
    const logged = logSpy.mock.calls.map(call => JSON.parse(call[0]));
    expect(logged.find(l => l.event === 'weeklyBrief_no_recipients')).toBeDefined();
  });

  it('logs structured success with the reporting window and document count, never the recipient list', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const dbClient = makeDbClient({
      dailyMetricsDocs: [weekDoc('2026-07-20', 60, 50)],
      intelligenceUsers: [{ email: 'secret-recipient@example.com' }],
    });
    const resendClient = makeResendClient();

    await runWeeklyMovementBrief(dbClient, resendClient, new Date('2026-07-20T15:00:00Z'));

    const logged = logSpy.mock.calls.map(call => JSON.parse(call[0]));
    const completeLog = logged.find(l => l.event === 'weeklyBrief_complete');
    expect(completeLog).toBeDefined();
    expect(completeLog.status).toBe('success');
    expect(completeLog.message).toContain('2026-07-14');
    expect(completeLog.message).toContain('2026-07-20');
    // No log line anywhere may contain the recipient's actual email.
    for (const entry of logged) {
      expect(JSON.stringify(entry)).not.toContain('secret-recipient@example.com');
    }
  });

  it('logs structured failure when the Firestore query itself throws', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const dbClient = {
      collection: () => ({
        where: function () { return this; },
        orderBy: function () { return this; },
        limit: function () { return this; },
        get: async () => { throw new Error('Firestore unavailable'); },
      }),
    };
    const resendClient = makeResendClient();

    await runWeeklyMovementBrief(dbClient, resendClient, new Date('2026-07-20T15:00:00Z'));

    const logged = logSpy.mock.calls.map(call => JSON.parse(call[0]));
    const failureLog = logged.find(l => l.event === 'weeklyBrief_failed');
    expect(failureLog).toBeDefined();
    expect(failureLog.severity).toBe('ERROR');
    expect(failureLog.status).toBe('failed');
  });

  it('selects the Sunday-local reporting window even when UTC has already rolled to Monday', async () => {
    const whereSpy = vi.fn();
    const dbClient = makeDbClient({ dailyMetricsDocs: [], whereSpy });
    const resendClient = makeResendClient();

    // 2026-07-20T05:00:00Z is 2026-07-19 22:00 Pacific (PDT) -- still
    // Sunday locally, already Monday in UTC.
    await runWeeklyMovementBrief(dbClient, resendClient, new Date('2026-07-20T05:00:00Z'));

    expect(whereSpy).toHaveBeenCalledWith('date', '>=', '2026-07-13');
    expect(whereSpy).toHaveBeenCalledWith('date', '<=', '2026-07-19');
  });
});
