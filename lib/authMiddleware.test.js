import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyIdToken = vi.fn();
const docGet = vi.fn();

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken }),
}));

vi.mock('./firebaseAdmin', () => ({
  db: {
    collection: () => ({
      doc: () => ({ get: docGet }),
    }),
  },
}));

const { getUserProfile } = await import('./authMiddleware.js');

function reqWithAuth(headerValue) {
  return {
    headers: {
      get: (name) => (name.toLowerCase() === 'authorization' ? headerValue : null),
    },
  };
}

// A forged, unsigned token whose decoded payload claims the admin email.
// Its signature is invalid -- this is exactly what an attacker who read the
// old code would attempt.
function forgedAdminToken() {
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ email: 'albertlwatson@gmail.com', user_id: 'attacker-controlled' })
  ).toString('base64url');
  return `${header}.${payload}.invalidsignature`;
}

describe('getUserProfile', () => {
  beforeEach(() => {
    verifyIdToken.mockReset();
    docGet.mockReset();
  });

  it('returns Free with no token provided when there is no Authorization header', async () => {
    const result = await getUserProfile(reqWithAuth(null));
    expect(result).toEqual({ tier: 'Free', isPremium: false, error: 'No token provided' });
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('rejects a forged token whose payload claims the admin email but fails signature verification', async () => {
    verifyIdToken.mockRejectedValue(new Error('Firebase ID token has invalid signature'));

    const result = await getUserProfile(reqWithAuth(`Bearer ${forgedAdminToken()}`));

    expect(result.tier).toBe('Free');
    expect(result.isPremium).toBe(false);
    expect(result.isAdmin).toBeUndefined();
    expect(docGet).not.toHaveBeenCalled();
  });

  it('grants admin only from a Firestore flag on a cryptographically verified user', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'real-admin-uid' });
    docGet.mockResolvedValue({
      exists: true,
      data: () => ({ tier: 'Enterprise', isAdmin: true }),
    });

    const result = await getUserProfile(reqWithAuth('Bearer valid.verified.token'));

    expect(result).toEqual({
      tier: 'Enterprise',
      isPremium: true,
      userId: 'real-admin-uid',
      isAdmin: true,
    });
  });

  it('does not grant admin to a verified user without the Firestore isAdmin flag', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'regular-uid' });
    docGet.mockResolvedValue({
      exists: true,
      data: () => ({ tier: 'Free' }),
    });

    const result = await getUserProfile(reqWithAuth('Bearer valid.verified.token'));

    expect(result.isAdmin).toBe(false);
    expect(result.tier).toBe('Free');
  });

  it('returns Free when the verified user has no Firestore profile', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'no-profile-uid' });
    docGet.mockResolvedValue({ exists: false });

    const result = await getUserProfile(reqWithAuth('Bearer valid.verified.token'));

    expect(result).toEqual({
      tier: 'Free',
      isPremium: false,
      error: 'User profile not found',
    });
  });
});
