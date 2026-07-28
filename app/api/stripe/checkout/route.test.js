import { describe, it, expect, vi, beforeEach } from 'vitest';

const customersCreate = vi.fn();
const checkoutSessionsCreate = vi.fn();
const docGet = vi.fn();
const docSet = vi.fn();

vi.mock('stripe', () => ({
  default: class MockStripe {
    constructor() {
      return {
        customers: { create: customersCreate },
        checkout: { sessions: { create: checkoutSessionsCreate } },
      };
    }
  },
}));

vi.mock('../../../../lib/firebaseAdmin', () => ({
  db: {
    collection: () => ({
      doc: () => ({ get: docGet, set: docSet }),
    }),
  },
}));

function jsonRequest(body) {
  return { json: async () => body };
}

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    customersCreate.mockReset();
    checkoutSessionsCreate.mockReset();
    docGet.mockReset();
    docSet.mockReset();
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_real');
    vi.stubEnv('STRIPE_PRICE_ID_INTELLIGENCE', 'price_intelligence_123');
  });

  it('fails closed with 503 and writes nothing when STRIPE_SECRET_KEY is missing', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    const { POST } = await import('./route.js');

    const res = await POST(jsonRequest({ userId: 'u1', email: 'a@b.com' }));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBeDefined();
    expect(checkoutSessionsCreate).not.toHaveBeenCalled();
    expect(docSet).not.toHaveBeenCalled();
  });

  it('fails closed with 503 when the price ID is missing, even with a secret key configured', async () => {
    vi.stubEnv('STRIPE_PRICE_ID_INTELLIGENCE', '');
    const { POST } = await import('./route.js');

    const res = await POST(jsonRequest({ userId: 'u1', email: 'a@b.com' }));
    expect(res.status).toBe(503);
    expect(checkoutSessionsCreate).not.toHaveBeenCalled();
  });

  it('rejects requests missing userId or email before touching Stripe', async () => {
    const { POST } = await import('./route.js');

    const res = await POST(jsonRequest({ email: 'a@b.com' }));
    expect(res.status).toBe(400);
    expect(checkoutSessionsCreate).not.toHaveBeenCalled();
  });

  it('attaches userId, tier, and priceId to session metadata for webhook reconciliation', async () => {
    docGet.mockResolvedValue({ data: () => ({}) });
    customersCreate.mockResolvedValue({ id: 'cus_new' });
    checkoutSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/session/xyz' });

    const { POST } = await import('./route.js');
    const res = await POST(jsonRequest({ userId: 'u1', email: 'a@b.com' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe('https://checkout.stripe.com/session/xyz');
    expect(checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { userId: 'u1', tier: 'Intelligence', priceId: 'price_intelligence_123' },
      })
    );
  });

  it('reuses an existing Stripe customer instead of creating a duplicate', async () => {
    docGet.mockResolvedValue({ data: () => ({ stripeCustomerId: 'cus_existing' }) });
    checkoutSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/session/abc' });

    const { POST } = await import('./route.js');
    await POST(jsonRequest({ userId: 'u1', email: 'a@b.com' }));

    expect(customersCreate).not.toHaveBeenCalled();
    expect(checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing' })
    );
  });
});
