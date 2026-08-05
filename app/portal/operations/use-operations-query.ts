'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PaginationState,
  SortingState
} from '@tanstack/react-table';
import { SearchParamsProps } from '@/types';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/table';

/** URL keys owned by Operations navigation — not panel filters. */
const OPS_NAV_KEYS = new Set(['tab']);

function filterParamsFromUrl(
  urlSearchParams: URLSearchParams
): SearchParamsProps {
  const params: SearchParamsProps = {};
  urlSearchParams.forEach((value, key) => {
    if (OPS_NAV_KEYS.has(key)) return;
    if (value != null && value !== '') {
      params[key] = value;
    }
  });
  return params;
}

type UseOperationsQueryOptions = {
  /**
   * When set, URL filter params are only seeded if `?tab=` matches this id
   * (or is absent). Prevents Calendar deep-link filters from leaking into
   * sibling Operations panels that mount later.
   */
  forTab?: string;
};

/**
 * Local filter / pagination / sort state for Operations tab panels.
 * Mirrors the query shape the existing service functions expect.
 *
 * Seeds from the current URL once on mount so deep links from Calendar
 * (e.g. `due_date_start` / `recharge_date_end`) apply to the matching panel.
 */
export function useOperationsQuery(
  initial: SearchParamsProps = {},
  options: UseOperationsQueryOptions = {}
) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const { forTab } = options;

  // Read latest URL / filterBody at call time so replaceOpsUrl / applyFilters
  // stay stable and never write a stale tab or filter snapshot to the URL.
  const urlSearchParamsRef = useRef(urlSearchParams);
  urlSearchParamsRef.current = urlSearchParams;

  const [seed] = useState<SearchParamsProps>(() => {
    const urlTab = urlSearchParams.get('tab');
    const shouldSeedFromUrl = !forTab || !urlTab || urlTab === forTab;
    return {
      ...(shouldSeedFromUrl ? filterParamsFromUrl(urlSearchParams) : {}),
      ...initial
    };
  });

  const [filterBody, setFilterBody] = useState<Record<string, string>>(
    () => {
      const { page: _p, limit: _l, sort: _s, order: _o, ...rest } = seed;
      return Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v != null && v !== '')
      ) as Record<string, string>;
    }
  );
  const filterBodyRef = useRef(filterBody);
  filterBodyRef.current = filterBody;

  const [sorting, setSorting] = useState<SortingState>(() => {
    if (seed.sort && seed.order) {
      return [{ id: seed.sort, desc: seed.order === 'desc' }];
    }
    return [];
  });
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: Number(seed.page || DEFAULT_PAGE) - 1,
    pageSize: Number(seed.limit || DEFAULT_PAGE_SIZE)
  });

  const searchParams: SearchParamsProps = useMemo(() => {
    const params: SearchParamsProps = {
      ...filterBody,
      page: String(pageIndex + 1),
      limit: String(pageSize)
    };
    if (sorting.length > 0) {
      params.sort = sorting[0].id;
      params.order = sorting[0].desc ? 'desc' : 'asc';
    }
    return params;
  }, [filterBody, pageIndex, pageSize, sorting]);

  /** Stable string key so useAsyncData can depend on param changes. */
  const queryKey = useMemo(
    () => JSON.stringify(searchParams),
    [searchParams]
  );

  const replaceOpsUrl = useCallback(
    (nextFilterBody: Record<string, string>) => {
      const params = new URLSearchParams();
      // Panel identity wins over URL so a stale searchParams snapshot cannot
      // rewrite another tab's filters into the wrong ?tab=.
      const tab = forTab ?? urlSearchParamsRef.current.get('tab');
      if (tab) params.set('tab', tab);
      Object.entries(nextFilterBody).forEach(([key, value]) => {
        if (value != null && value !== '') params.set(key, value);
      });
      const qs = params.toString();
      router.replace(qs ? `/portal/operations?${qs}` : '/portal/operations', {
        scroll: false
      });
    },
    [router, forTab]
  );

  const clearFilters = useCallback(() => {
    setFilterBody({});
    setSorting([]);
    setPagination({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
    replaceOpsUrl({});
  }, [replaceOpsUrl]);

  const applyFilters = useCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    replaceOpsUrl(filterBodyRef.current);
  }, [replaceOpsUrl]);

  return {
    filterBody,
    setFilterBody,
    sorting,
    setSorting,
    pageIndex,
    pageSize,
    setPagination,
    searchParams,
    queryKey,
    clearFilters,
    applyFilters
  };
}
