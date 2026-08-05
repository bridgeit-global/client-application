'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type UseAsyncDataOptions = {
  enabled?: boolean;
  /** When this key changes, a refetch is triggered (while enabled). */
  deps?: unknown[];
  /**
   * Unique scope for session cache (e.g. panel id). Required to survive
   * Suspense remounts after server-action router.refresh() without colliding
   * with other panels that share the same deps shape.
   */
  cacheScope?: string;
};

type UseAsyncDataResult<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

/** Panel-scoped cache so remounts keep prior rows instead of skeleton loops. */
const sessionCache = new Map<string, unknown>();

type InvalidateListener = (prefixes: string[]) => void;
const invalidateListeners = new Set<InvalidateListener>();

function buildCacheKey(scope: string | undefined, deps: unknown[]): string | null {
  if (!scope) return null;
  try {
    return `${scope}:${JSON.stringify(deps)}`;
  } catch {
    return `${scope}:${String(deps)}`;
  }
}

function matchesScopePrefix(keyOrScope: string, prefix: string): boolean {
  return keyOrScope === prefix || keyOrScope.startsWith(`${prefix}:`);
}

function scopeMatchesPrefixes(scope: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => matchesScopePrefix(scope, prefix));
}

/**
 * Clear session-cached entries whose keys start with any of `scopePrefixes`,
 * and notify mounted `useAsyncData` hooks so they refetch when enabled.
 *
 * Cache keys are `${cacheScope}:${depsJson}`; matching is by prefix so
 * `ops:bill-approved` clears every filter variant for that panel.
 */
export function invalidateAsyncData(scopePrefixes: string[]): void {
  if (scopePrefixes.length === 0) return;

  Array.from(sessionCache.keys()).forEach((key) => {
    if (scopePrefixes.some((prefix) => matchesScopePrefix(key, prefix))) {
      sessionCache.delete(key);
    }
  });

  Array.from(invalidateListeners).forEach((listener) => {
    listener(scopePrefixes);
  });
}

/**
 * Fetches once when `enabled` becomes true, and again whenever `deps` change
 * while still enabled. Does not fetch while disabled.
 *
 * Uses a monotonic request id so a cancelled in-flight call cannot leave
 * `isLoading` stuck true (common when deps change or Strict Mode remounts).
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: UseAsyncDataOptions = {}
): UseAsyncDataResult<T> {
  const { enabled = true, deps = [], cacheScope } = options;
  const cacheKey = buildCacheKey(cacheScope, deps);
  const [data, setData] = useState<T | null>(() =>
    cacheKey && sessionCache.has(cacheKey)
      ? (sessionCache.get(cacheKey) as T)
      : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const hasLoadedRef = useRef(
    Boolean(cacheKey && sessionCache.has(cacheKey))
  );
  const requestIdRef = useRef(0);
  const cacheScopeRef = useRef(cacheScope);
  cacheScopeRef.current = cacheScope;

  const refetch = useCallback(() => {
    setRefetchToken((t) => t + 1);
  }, []);

  // Subscribe so mutations can clear cache + bump mounted panels.
  useEffect(() => {
    if (!cacheScope) return;

    const listener: InvalidateListener = (prefixes) => {
      const scope = cacheScopeRef.current;
      if (!scope || !scopeMatchesPrefixes(scope, prefixes)) return;
      // Keep prior rows; sessionCache was already cleared by invalidateAsyncData.
      setRefetchToken((t) => t + 1);
    };

    invalidateListeners.add(listener);
    return () => {
      invalidateListeners.delete(listener);
    };
  }, [cacheScope]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    const hasCached = Boolean(cacheKey && sessionCache.has(cacheKey));
    // Skeleton only on first load; remounts/invalidations keep prior rows.
    if (!hasCached && !hasLoadedRef.current) setIsLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        if (cacheKey) sessionCache.set(cacheKey, result);
        setData(result);
        hasLoadedRef.current = true;
      })
      .catch((err: unknown) => {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refetchToken, cacheKey, ...deps]);

  return {
    data,
    isLoading: enabled && (isLoading || (!hasLoadedRef.current && data === null)),
    error,
    refetch
  };
}
