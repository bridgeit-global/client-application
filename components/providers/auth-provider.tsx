'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Syncs Next.js RSC cache with auth transitions only.
 * Do not refresh on INITIAL_SESSION / TOKEN_REFRESHED — those fire often
 * (and can loop with middleware cookie refresh), remounting pages that
 * re-run server actions (e.g. Operations panels).
 *
 * Subscribe once on mount. `router` from useRouter is read via a ref so
 * navigation never re-creates the auth listener (and never stacks
 * concurrent subscriptions / redundant refresh calls).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        routerRef.current.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
