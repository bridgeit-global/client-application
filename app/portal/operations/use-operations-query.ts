'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  PaginationState,
  SortingState
} from '@tanstack/react-table';
import { SearchParamsProps } from '@/types';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/table';

/**
 * Local (non-URL) filter / pagination / sort state for Operations tab panels.
 * Mirrors the query shape the existing service functions expect.
 */
export function useOperationsQuery(initial: SearchParamsProps = {}) {
  const [filterBody, setFilterBody] = useState<Record<string, string>>(
    () => {
      const { page: _p, limit: _l, sort: _s, order: _o, ...rest } = initial;
      return Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v != null && v !== '')
      ) as Record<string, string>;
    }
  );
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (initial.sort && initial.order) {
      return [{ id: initial.sort, desc: initial.order === 'desc' }];
    }
    return [];
  });
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: Number(initial.page || DEFAULT_PAGE) - 1,
    pageSize: Number(initial.limit || DEFAULT_PAGE_SIZE)
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

  const clearFilters = useCallback(() => {
    setFilterBody({});
    setSorting([]);
    setPagination({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  }, []);

  const applyFilters = useCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

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
