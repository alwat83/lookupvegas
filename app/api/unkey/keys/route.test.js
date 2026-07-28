import { describe, it, expect, vi, beforeEach } from 'vitest';

const getUserProfile = vi.fn();
const createUnkeyToken = vi.fn();
const listUnkeyTokens = vi.fn();
const revokeUnkeyToken = vi.fn();

vi.mock('../../../../lib/authMiddleware', () => ({ getUserProfile }));
vi.mock('../../../../lib/unkey', () => ({ createUnkeyToken, listUnkeyTokens, revokeUnkeyToken }));

function requestWithReferer(referer, { url = 'https://lookupvegas.com/api/unkey/keys', json } = {}) {
  return {
    url,
    headers: { get: (name) => (name.toLowerCase() === 'referer' ? referer : null) },
    json: json || (async () => ({})),
  };
}

describe('GET/POST/DELETE /api/unkey/keys', () => {
  beforeEach(() => {
    getUserProfile.mockReset();
    createUnkeyToken.mockReset();
    listUnkeyTokens.mockReset();
    revokeUnkeyToken.mockReset();
    vi.stubEnv('UNKEY_ROOT_KEY', 'real_root_key');
  });

  it('rejects a Free-tier user even when Referer claims unlocked=true (the forged-header attack)', async () => {
    getUserProfile.mockResolvedValue({ tier: 'Free', userId: 'u1' });
    const { GET } = await import('./route.js');

    const res = await GET(requestWithReferer('https://lookupvegas.com/terminal/api?unlocked=true'));
    expect(res.status).toBe(401);
    expect(listUnkeyTokens).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated request regardless of Referer', async () => {
    getUserProfile.mockResolvedValue({ tier: 'Free', userId: undefined, error: 'No token provided' });
    const { POST } = await import('./route.js');

    const res = await POST(requestWithReferer('https://lookupvegas.com/terminal/api?unlocked=true'));
    expect(res.status).toBe(401);
    expect(createUnkeyToken).not.toHaveBeenCalled();
  });

  it('allows key generation for a real, verified Enterprise-tier user', async () => {
    getUserProfile.mockResolvedValue({ tier: 'Enterprise', userId: 'u1' });
    createUnkeyToken.mockResolvedValue({ success: true, key: 'lkv_real', keyId: 'key_1' });
    const { POST } = await import('./route.js');

    const res = await POST(requestWithReferer(null));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.key).toBe('lkv_real');
    expect(createUnkeyToken).toHaveBeenCalledWith('u1', expect.any(String));
  });

  it('rejects a Free-tier user attempting to revoke a key via forged Referer', async () => {
    getUserProfile.mockResolvedValue({ tier: 'Free', userId: 'u1' });
    const { DELETE } = await import('./route.js');

    const res = await DELETE(
      requestWithReferer('https://lookupvegas.com/terminal/api?unlocked=true', {
        url: 'https://lookupvegas.com/api/unkey/keys?keyId=key_1',
      })
    );
    expect(res.status).toBe(401);
    expect(revokeUnkeyToken).not.toHaveBeenCalled();
  });

  it('allows revocation for a real, verified Enterprise-tier user', async () => {
    getUserProfile.mockResolvedValue({ tier: 'Enterprise', userId: 'u1' });
    revokeUnkeyToken.mockResolvedValue({ success: true });
    const { DELETE } = await import('./route.js');

    const res = await DELETE(
      requestWithReferer(null, { url: 'https://lookupvegas.com/api/unkey/keys?keyId=key_1' })
    );
    expect(res.status).toBe(200);
    expect(revokeUnkeyToken).toHaveBeenCalledWith('key_1');
  });
});
