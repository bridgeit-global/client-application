'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type UseAsyncDataOptions = {
  enabled?: boolean;
  /** When this key changes, a refetch is triggered (while enabled). */
  deps?: unknown[];
};

type UseAsyncDataResult<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Fetches once when `enabled` becomes true, and again whenever `deps` change
 * while still enabled. Does not fetch while disabled.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: UseAsyncDataOptions = {}
): UseAsyncDataResult<T> {
  const { enabled = true, deps = [] } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        hasLoadedRef.current = true;
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refetchToken, ...deps]);

  const refetch = useCallback(() => {
    setRefetchToken((t) => t + 1);
  }, []);

  return {
    data,
    isLoading: enabled && (isLoading || (!hasLoadedRef.current && data === null)),
    error,
    refetch
  };
}
