import { describe, it, expect, vi, beforeEach } from 'vitest';

const constructEvent = vi.fn();
const processedEventGet = vi.fn();
const processedEventSet = vi.fn();
const userDocSet = vi.fn();
const usersWhereGet = vi.fn();

vi.mock('stripe', () => ({
  default: class MockStripe {
    constructor() {
      return { webhooks: { constructEvent } };
    }
  },
}));

vi.mock('../../../../lib/firebaseAdmin', () => ({
  db: {
    collection: (name) => {
      if (name === 'processedStripeEvents') {
        return { doc: () => ({ get: processedEventGet, set: processedEventSet }) };
      }
      if (name === 'users') {
        return {
          doc: () => ({ set: userDocSet }),
          where: () => ({ get: usersWhereGet }),
        };
      }
      throw new Error(`Unexpected collection: ${name}`);
    },
  },
}));

function webhookRequest(rawBody) {
  return {
    headers: { get: () => 'test-signature' },
    text: async () => rawBody,
  };
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    constructEvent.mockReset();
    processedEventGet.mockReset();
    processedEventSet.mockReset();
    userDocSet.mockReset();
    usersWhereGet.mockReset();
    processedEventGet.mockResolvedValue({ exists: false });
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_real');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_real');
  });

  it('fails closed and writes nothing when webhook secrets are not configured', async () => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '');
    const { POST } = await import('./route.js');

    const res = await POST(webhookRequest('{}'));
    expect(res.status).toBe(200);
    expect(constructEvent).not.toHaveBeenCalled();
    expect(userDocSet).not.toHaveBeenCalled();
  });

  it('rejects a request with an invalid or forged signature and writes nothing', async () => {
    constructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });
    const { POST } = await import('./route.js');

    const res = await POST(webhookRequest('forged-payload'));
    expect(res.status).toBe(400);
    expect(userDocSet).not.toHaveBeenCalled();
    expect(processedEventGet).not.toHaveBeenCalled();
  });

  it('skips a duplicate delivery of an already-processed event without writing again', async () => {
    processedEventGet.mockResolvedValue({ exists: true });
    constructEvent.mockReturnValue({
      id: 'evt_123',
      type: 'checkout.session.completed',
      data: { object: { metadata: { userId: 'u1' }, subscription: 'sub_1' } },
    });
    const { POST } = await import('./route.js');

    const res = await POST(webhookRequest('{}'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(userDocSet).not.toHaveBeenCalled();
    expect(processedEventSet).not.toHaveBeenCalled();
  });

  it('does not upgrade any tier when checkout.session.completed has no userId in metadata', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_no_metadata',
      type: 'checkout.session.completed',
      data: { object: { metadata: {}, subscription: 'sub_2' } },
    });
    const { POST } = await import('./route.js');

    const res = await POST(webhookRequest('{}'));
    expect(res.status).toBe(200);
    expect(userDocSet).not.toHaveBeenCalled();
    // The event is still marked processed -- it was handled (safely, as a no-op), not lost.
    expect(processedEventSet).toHaveBeenCalled();
  });

  it('upgrades the user to Intelligence tier on a verified checkout.session.completed and marks the event processed', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_success',
      type: 'checkout.session.completed',
      data: { object: { metadata: { userId: 'u1' }, subscription: 'sub_3' } },
    });
    const { POST } = await import('./route.js');

    const res = await POST(webhookRequest('{}'));
    expect(res.status).toBe(200);
    expect(userDocSet).toHaveBeenCalledWith(
      expect.objectContaining({
        tier: 'Intelligence',
        subscriptionStatus: 'active',
        stripeSubscriptionId: 'sub_3',
      }),
      { merge: true }
    );
    expect(processedEventSet).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'checkout.session.completed' })
    );
  });

  it('downgrades to Free tier when a subscription is canceled', async () => {
    usersWhereGet.mockResolvedValue({
      empty: false,
      docs: [{ ref: { set: userDocSet } }],
    });
    constructEvent.mockReturnValue({
      id: 'evt_cancel',
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_1', status: 'canceled' } },
    });
    const { POST } = await import('./route.js');

    await POST(webhookRequest('{}'));
    expect(userDocSet).toHaveBeenCalledWith(
      { tier: 'Free', subscriptionStatus: 'canceled' },
      { merge: true }
    );
  });
});
