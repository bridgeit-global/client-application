import { createClient } from '@/lib/supabase/server';

/**
 * Get a presigned URL for a file in the S3 bucket (server-side)
 * @param key - The file key/path in the bucket (e.g., 'folder/file.jpg')
 * @returns The presigned URL
 */
export async function getPresignedUrlServer(key: string): Promise<string> {
  const supabase = await createClient();
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

