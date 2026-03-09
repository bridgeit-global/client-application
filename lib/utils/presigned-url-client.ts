import { createClient } from '@/lib/supabase/client';

const SUPABASE_STORAGE_BUCKET = 'bill-documents';

function isSupabaseStoragePath(key: string): boolean {
  return key.endsWith('.pdf');
}

/**
 * Get a presigned/signed URL for a file (client-side).
 * Automatically detects whether the file is in Supabase Storage (submeter bills)
 * or S3 (regular bills) and returns the appropriate signed URL.
 */
export async function getPresignedUrl(key: string): Promise<string> {
  const supabase = createClient();

  if (isSupabaseStoragePath(key)) {
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

