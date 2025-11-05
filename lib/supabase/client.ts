import { createBrowserClient } from '@supabase/ssr';
import { createClient as createBrowsersClient } from '@supabase/supabase-js'

export function createClient() {
  // Create a supabase client on the browser with project's credentials
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'portal'
      }
    }
  );
}

export function createPublicClient() {
  return createBrowsersClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'public'
      }
    }
  );
}
