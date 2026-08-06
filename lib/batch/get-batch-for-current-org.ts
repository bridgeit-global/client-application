import { createClient } from '@/lib/supabase/server';

/**
 * Load a batch only if it belongs to the caller's org.
 * Returns null when missing or cross-org (do not distinguish).
 */
export async function getBatchForCurrentOrg(batchId: string) {
  if (!batchId) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const orgId = user?.user_metadata?.org_id as string | undefined;
  if (!user || !orgId) return null;

  const { data, error } = await supabase
    .from('batches')
    .select('batch_id, org_id, batch_status, validate_at, created_at, created_by, batch_name, user_actions')
    .eq('batch_id', batchId)
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) {
    console.error('getBatchForCurrentOrg error:', error);
    return null;
  }

  return data;
}
