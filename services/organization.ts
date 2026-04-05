import { OrganizationProps } from '@/types/organization-type';
import { createClient, createServicePortalClient } from '@/lib/supabase/server';

/** Default `organizations.site_name` when repairing or backfilling a missing row. */
export const DEFAULT_ORG_SITE_NAME = 'site';

/**
 * Load the current user's organization. If JWT has `org_id` but no row exists (orphaned
 * metadata), inserts a minimal organization row with service role so portal pages do not 500.
 */
export async function fetchOrganization(): Promise<OrganizationProps> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const orgId = user?.user_metadata?.org_id as string | undefined;

  if (!orgId) {
    throw new Error('Missing organization context');
  }

  const { data: row, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (row) {
    return row as OrganizationProps;
  }

  const portal = createServicePortalClient();
  const fallbackName =
    user?.email?.split('@')[0]?.replace(/[._]+/g, ' ').trim() || 'Organization';

  const { error: insertError } = await portal.from('organizations').insert({
    id: orgId,
    name: fallbackName,
    site_name: DEFAULT_ORG_SITE_NAME,
    batch_threshold_amount: 0
  });

  if (insertError && insertError.code !== '23505') {
    throw insertError;
  }

  const { data: fixed, error: fetchErr } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (fetchErr || !fixed) {
    throw fetchErr ?? new Error('Organization row missing after repair');
  }

  return fixed as OrganizationProps;
}
