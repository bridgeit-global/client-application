import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

/**
 * Update user metadata using Supabase Edge Function (client-side)
 * @param metadata - The user metadata to update
 * @returns The updated user object
 */
export async function updateUserMetadata(metadata: Record<string, any>): Promise<User> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/update-user-metadata`,
    {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}` 
      },
      body: JSON.stringify(metadata)
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorData.message || `Failed to update user metadata: ${res.statusText}`);
  }

  const { user } = await res.json();
  return user;
}
