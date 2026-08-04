'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Syncs Next.js RSC cache with auth transitions only.
 * Do not refresh on INITIAL_SESSION / TOKEN_REFRESHED — those fire often
 * (and can loop with middleware cookie refresh), remounting pages that
 * re-run server actions (e.g. Operations panels).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return <>{children}</>;
}
