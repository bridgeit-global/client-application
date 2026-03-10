import { createClient } from '@/lib/supabase/client';

export type StorageSource = 's3' | 'supabase-storage';

const SUPABASE_STORAGE_BUCKET = 'bill-documents';

export function getStorageSourceFromPaytype(paytype: number | null | undefined): StorageSource {
  return paytype === -1 ? 'supabase-storage' : 's3';
}

/**
 * Get a presigned/signed URL for a file (client-side).
 * - source 'supabase-storage': fetches from Supabase Storage bill-documents bucket (submeter bills)
 * - source 's3': fetches via the get-s3-presigned-url Edge Function (prepaid/postpaid bills)
 */
export async function getPresignedUrl(key: string, source: StorageSource = 's3'): Promise<string> {
  const supabase = createClient();

  if (source === 'supabase-storage') {
    const { data, error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .createSignedUrl(key, 120);

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to get signed URL from Supabase Storage: ${error?.message ?? 'Unknown error'}`);
    }

    return data.signedUrl;
  }

  const { data: { session } } = await supabase.auth.getSession();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/get-s3-presigned-url?method=get&key=${encodeURIComponent(key)}&expires=120`,
    {
      headers: { 
        Authorization: `Bearer ${session?.access_token ?? ''}` 
      }
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to get presigned URL: ${res.statusText}`);
  }

  const { url } = await res.json();
  return url;
}

