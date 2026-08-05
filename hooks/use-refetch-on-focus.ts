'use client';

import { useEffect, useRef } from 'react';

/**
 * Invokes `callback` when the tab becomes visible again after being hidden.
 * Ignores plain window `focus` (fires too often during in-page UI / DevTools)
 * so Operations server-action panels do not refetch in a tight loop.
 */
export function useRefetchOnFocus(callback: () => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let wasHidden = document.visibilityState === 'hidden';

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden = true;
        return;
      }
      if (wasHidden) {
        wasHidden = false;
        callbackRef.current();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
}
