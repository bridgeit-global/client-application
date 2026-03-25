'use server';

import { getFullConnections } from '@/services/sites';
import type { Connection } from '@/types/site-type';

export async function loadSiteConnectionsAction(
  siteId: string
): Promise<{ connections: Connection[] | null; error?: string }> {
  if (!siteId) {
    return { connections: null, error: 'Missing site id' };
  }
  try {
    const connections = await getFullConnections(siteId);
    return { connections };
  } catch (e) {
    return {
      connections: null,
      error: e instanceof Error ? e.message : 'Failed to load connections'
    };
  }
}
