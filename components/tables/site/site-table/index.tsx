'use client';

import { Button } from '@/components/ui/button';
import { FilterX } from 'lucide-react';
import { columns } from './columns';
import FilterAction from './filter-action';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable
} from '@tanstack/react-table';
import { getFilterDataLength, defaultColumnSizing } from '@/lib/utils/table';
import FilterChips from '@/components/filter-chip';
import CustomTable from '@/components/custom-table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ExportButton from '@/components/buttons/export-button';
import { SearchParamsProps } from '@/types';
import { createQueryString } from '@/lib/createQueryString';
import { SiteConnectionTableProps } from '@/types/site-type';
import { AddSiteButton } from '@/components/buttons/add-site-button';
import TableColumns from '@/components/table-columns';
import { useSiteName } from '@/lib/utils/site';
interface DataTableProps {
  data: SiteConnectionTableProps[];
  totalCount: number;
  pageCount: number;
  searchParams?: SearchParamsProps;
  active_count?: number;
}

import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/table';
import { createClient } from '@/lib/supabase/client';
const DEFAULT_VISIBLE_COLUMNS = ['id', 'type', 'zone_id', 'connections', 'created_at', 'actions'];

export function SiteTable({
  data,
  pageCount,
  totalCount,
  active_count
}: DataTableProps) {
  const site_name = useSiteName();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());
  const [filterBody, setFilterBody] = useState(params);
  const [isLoading, setIsLoading] = useState(false);

  const page = params?.page || DEFAULT_PAGE;
  const perPage = params?.limit || DEFAULT_PAGE_SIZE;
  const pageAsNumber = Number(page);
  const perPageAsNumber = Number(perPage);

  const fallbackPage = isNaN(pageAsNumber) || pageAsNumber < 1 ? DEFAULT_PAGE : pageAsNumber;
  const fallbackPerPage = isNaN(perPageAsNumber) ? DEFAULT_PAGE_SIZE : perPageAsNumber;

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: fallbackPage - 1,
    pageSize: fallbackPerPage
  });

  // get user station type
  const supabase = createClient();
  const getUser = async () => {
    if (filterBody.type) {
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.station_type) {
      setFilterBody({ ...filterBody, type: user?.user_metadata?.station_type } as any);
    }
  }
  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const currentHash = window.location.hash;

    router.push(
      `${pathname}?${createQueryString(searchParams, {
        ...filterBody,
        page: String(pageIndex + 1),
        limit: String(pageSize)
      })}${currentHash}`,
      { scroll: false }
    );

  }, [filterBody, router, pathname, createQueryString, pageIndex, pageSize]);

  useEffect(() => {
    if (data.length > 0) {
      setIsLoading(false);
    }
  }, [data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [filterBody, pageIndex, pageSize]);

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination: { pageIndex, pageSize }
    },
    onPaginationChange: (updater) => {
      setIsLoading(true);
      setPagination(updater);
    },
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    defaultColumn: defaultColumnSizing,
    columnResizeMode: 'onChange'
  });

  const clearFilter = async () => {
    setIsLoading(true);
    // Reset pagination first
    setPagination({ pageIndex: 0, pageSize: fallbackPerPage });
    // Clear the filter body
    setFilterBody({});
    // Navigate to clean URL with only pagination params
    router.push(
      `${pathname}?page=1&limit=${fallbackPerPage}`,
      { scroll: false }
    );
    setIsLoading(false);
  };

  const applyFilters = useCallback(() => {
    router.push(
      `${pathname}?${createQueryString(searchParams, {
        ...filterBody,
        page: DEFAULT_PAGE,
        limit: DEFAULT_PAGE_SIZE
      })}`,
      { scroll: false }
    );
  }, [router, pathname, createQueryString, filterBody]);

  const filterCount = useMemo(() => getFilterDataLength(filterBody), [filterBody]);

  return (
    <>
      <div className="flex flex-1 justify-between gap-2">
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold tracking-tight">
            {site_name}
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex h-2 w-2 rounded-full bg-green-500" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{active_count}</span> Active
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <AddSiteButton />
          <FilterAction
            filterBody={filterBody}
            setFilterBody={setFilterBody}
            handleApplyFilters={applyFilters}
            handleClearFilter={clearFilter}
          />
          <ExportButton file_name="site" />
          <TableColumns table={table} />
        </div>
      </div>
      <div className="my-2">
        <FilterChips
          filterBody={filterBody}
          setFilterBody={setFilterBody}
          fetchData={applyFilters}
        />
      </div>
      <CustomTable
        isLoading={isLoading}
        columns={columns}
        pageSize={pageSize}
        table={table}
        totalCount={totalCount}
        defaultVisibleColumns={DEFAULT_VISIBLE_COLUMNS}
      />
    </>
  );
}
