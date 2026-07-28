import { describe, it, expect, vi } from 'vitest';

// functions/index.js requires "resend" at module scope, and its
// constructor validates that an API key string is present. It is never
// otherwise touched by runDailySnapshot, so a syntactically-plausible
// dummy value is enough to let the module load without needing a real
// Resend account. (admin.initializeApp() at module scope does not throw
// without credentials -- it fails lazily, only on an actual Firestore
// call, which runDailySnapshot never makes either.)
vi.stubEnv('RESEND_API_KEY', 're_test_dummy_key_for_module_load_only');

const { runDailySnapshot } = await import('./index.js');

describe('runDailySnapshot', () => {
  const targetUrl = 'https://lookupvegas.com/api/cron/snapshot';

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

    expect(fetchImpl).toHaveBeenCalledWith(targetUrl, {
      method: 'GET',
      headers: { Authorization: 'Bearer my-secret' },
    });
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
});
