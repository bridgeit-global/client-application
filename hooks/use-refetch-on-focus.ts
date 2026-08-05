'use client';

import { useEffect, useRef } from 'react';

/**
 * Invokes `callback` when the window regains focus or the tab becomes
 * visible again. Useful for cheap refetches of data that may have changed
 * while the user was away (background webhooks, other sessions, or work
 * done in a sibling tab).
 */
export function useRefetchOnFocus(callback: () => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        callbackRef.current();
      }
    };

    window.addEventListener('focus', handler);
    document.addEventListener('visibilitychange', handler);
    return () => {
      window.removeEventListener('focus', handler);
      document.removeEventListener('visibilitychange', handler);
    };
  }, []);
}
