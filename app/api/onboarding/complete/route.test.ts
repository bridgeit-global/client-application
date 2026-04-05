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

  it('returns existing org when user already has org_id and DB row exists', async () => {
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

    const maybeSingle = jest.fn().mockResolvedValue({ data: { id: 'org-existing' }, error: null });
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    (server.createServicePortalClient as jest.Mock).mockReturnValue({ from });

    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.orgId).toBe('org-existing');
    expect(json.alreadyOnboarded).toBe(true);
    expect(from).toHaveBeenCalledWith('organizations');
  });

  it('creates organization row when org_id is in metadata but row is missing', async () => {
    (server.createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: 'user-uuid',
              email: 'a@b.com',
              user_metadata: { org_id: 'orphan-org-id' }
            },
            error: null
          }
        })
      }
    });

    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    const insert = jest.fn().mockResolvedValue({ error: null });
    const from = jest.fn(() => ({ select, insert }));
    (server.createServicePortalClient as jest.Mock).mockReturnValue({ from });

    const updateUserById = jest.fn().mockResolvedValue({ error: null });
    const getUserById = jest.fn().mockResolvedValue({
      data: { user: { user_metadata: { org_id: 'orphan-org-id' } } },
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

    const res = await POST(
      makeRequest({
        organization: {
          name: 'Acme Corp',
          company_email: '',
          logo_url: ''
        },
        siteTypes: [],
        zoneIds: []
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.orgId).toBe('orphan-org-id');
    expect(json.alreadyOnboarded).toBe(false);
    expect(insert).toHaveBeenCalled();
    const insertPayload = insert.mock.calls[0][0];
    expect(insertPayload.id).toBe('orphan-org-id');
    expect(insertPayload.site_name).toBe('site');
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

  it('returns 400 when a master row is only half filled', async () => {
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
        organization: {
          name: 'Acme Corp',
          site_name: 'Acme',
          company_email: '',
          logo_url: ''
        },
        siteTypes: [{ value: 'COCO', name: '' }],
        zoneIds: []
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

  it('creates organization without inserting org_master when masters are empty', async () => {
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

    const res = await POST(
      makeRequest({
        organization: {
          name: 'Acme Corp',
          site_name: 'Acme',
          company_email: '',
          logo_url: ''
        },
        siteTypes: [],
        zoneIds: []
      })
    );

    expect(res.status).toBe(200);
    expect(from).toHaveBeenCalledWith('organizations');
    expect(from).not.toHaveBeenCalledWith('org_master');
    expect(insert).toHaveBeenCalledTimes(1);
  });
});
