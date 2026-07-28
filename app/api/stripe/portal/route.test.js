import { describe, it, expect, vi, beforeEach } from 'vitest';

const billingPortalCreate = vi.fn();
const docGet = vi.fn();

vi.mock('stripe', () => ({
  default: class MockStripe {
    constructor() {
      return { billingPortal: { sessions: { create: billingPortalCreate } } };
    }
  },
}));

vi.mock('../../../../lib/firebaseAdmin', () => ({
  db: {
    collection: () => ({ doc: () => ({ get: docGet }) }),
  },
}));

function jsonRequest(body) {
  return { json: async () => body };
}

describe('POST /api/stripe/portal', () => {
  beforeEach(() => {
    billingPortalCreate.mockReset();
    docGet.mockReset();
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_real');
  });

  it('fails closed with 503 instead of returning a simulated portal URL when unconfigured', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    const { POST } = await import('./route.js');

    const res = await POST(jsonRequest({ userId: 'u1', returnUrl: 'https://app/pricing' }));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.url).toBeUndefined();
    expect(billingPortalCreate).not.toHaveBeenCalled();
  });

  it('returns 404 when the user has no Stripe customer on file', async () => {
    docGet.mockResolvedValue({ data: () => ({}) });
    const { POST } = await import('./route.js');

    const res = await POST(jsonRequest({ userId: 'u1', returnUrl: 'https://app/pricing' }));
    expect(res.status).toBe(404);
    expect(billingPortalCreate).not.toHaveBeenCalled();
  });
});
