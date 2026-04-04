/**
 * @jest-environment node
 */
import { POST } from './route';
import * as server from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
  createAdminClient: jest.fn(),
  createServicePortalClient: jest.fn()
}));

const validBody = () => ({
  organization: {
    name: 'Acme Corp',
    site_name: 'Acme',
    company_email: '',
    logo_url: ''
  },
  siteTypes: [{ value: 'COCO', name: 'COCO' }],
  zoneIds: [{ value: 'Z1', name: 'Zone 1' }]
});

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

describe('POST /api/onboarding/complete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 401 when there is no user', async () => {
    (server.createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null }, error: null })
      }
    });

    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(401);
  });

  it('returns existing org when user already has org_id', async () => {
    (server.createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: 'u1',
              email: 'a@b.com',
              user_metadata: { org_id: 'org-existing', role: 'admin' }
            },
            error: null
          }
        })
      }
    });

    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.orgId).toBe('org-existing');
    expect(json.alreadyOnboarded).toBe(true);
    expect(server.createServicePortalClient).not.toHaveBeenCalled();
  });

  it('returns 403 for operator accounts', async () => {
    (server.createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: 'u1',
              email: 'a@b.com',
              user_metadata: { role: 'operator' }
            },
            error: null
          }
        })
      }
    });

    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid payload', async () => {
    (server.createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: 'u1',
              email: 'a@b.com',
              user_metadata: {}
            },
            error: null
          }
        })
      }
    });

    const res = await POST(
      makeRequest({
        organization: { name: 'x' },
        siteTypes: [],
        zoneIds: [{ value: 'Z', name: 'Z' }]
      })
    );
    expect(res.status).toBe(400);
  });

  it('creates organization and updates user metadata on success', async () => {
    (server.createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: 'user-uuid',
              email: 'a@b.com',
              user_metadata: {}
            },
            error: null
          }
        })
      }
    });

    const insert = jest.fn().mockResolvedValue({ error: null });
    const from = jest.fn(() => ({ insert }));
    (server.createServicePortalClient as jest.Mock).mockReturnValue({ from });

    const updateUserById = jest.fn().mockResolvedValue({ error: null });
    const getUserById = jest.fn().mockResolvedValue({
      data: { user: { user_metadata: {} } },
      error: null
    });
    (server.createAdminClient as jest.Mock).mockReturnValue({
      auth: {
        admin: {
          getUserById,
          updateUserById
        }
      }
    });

    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.orgId).toBe('00000000-0000-4000-8000-000000000001');
    expect(json.alreadyOnboarded).toBe(false);

    expect(from).toHaveBeenCalledWith('organizations');
    expect(from).toHaveBeenCalledWith('org_master');
    expect(insert).toHaveBeenCalledTimes(2);
    expect(updateUserById).toHaveBeenCalledWith('user-uuid', {
      user_metadata: {
        org_id: '00000000-0000-4000-8000-000000000001',
        role: 'admin'
      }
    });
  });
});
