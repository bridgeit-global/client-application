'use client';

import { Button } from '@/components/ui/button';
import { FilterX, Columns } from 'lucide-react';
import FilterAction from './filter-action';
import { SiteActionButton } from './cell-action';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
import { columns } from './columns';
import ExportButton from '@/components/buttons/export-button';
import { ConnectionTableProps } from '@/types/connections-type';
import { SearchParamsProps } from '@/types';
import { createQueryString } from '@/lib/createQueryString';
import TableColumns from '@/components/table-columns';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/table';

interface DataTableProps {
  data: ConnectionTableProps[];
  totalCount: number;
  pageCount: number;
  searchParams?: SearchParamsProps;
}

export function PrepaidBalanceLagTable<TData, TValue>({
  data,
  pageCount,
  totalCount
}: DataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());
  const [filterBody, setFilterBody] = useState(params);
  const [isLoading, setIsLoading] = useState(false);

  // Search params
  const page = params?.page || DEFAULT_PAGE;
  const perPage = params?.limit || DEFAULT_PAGE_SIZE;
  const pageAsNumber = Number(page);
  const perPageAsNumber = Number(perPage);
  const fallbackPage = isNaN(pageAsNumber) || pageAsNumber < 1 ? DEFAULT_PAGE : pageAsNumber;
  const fallbackPerPage = isNaN(perPageAsNumber) ? DEFAULT_PAGE_SIZE : perPageAsNumber;

  // Handle server-side pagination
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: fallbackPage - 1,
    pageSize: fallbackPerPage
  });

  useEffect(() => {
    setIsLoading(true);
    const currentHash = window.location.hash;
    router.push(
      `${pathname}?${createQueryString(searchParams, {
        ...filterBody,
        page: String(pageIndex + 1),
        limit: String(pageSize)
      })}${currentHash}`,
      {
        scroll: false
      }
    );
  }, [pageIndex, pageSize, filterBody, router, pathname, createQueryString]);

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
    columns: columns as any,
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
      {
        scroll: false
      }
    );
  }, [router, pathname, createQueryString, filterBody]);

  const filterCount = useMemo(() => getFilterDataLength(filterBody), [filterBody]);

  return (
    <>
      <div className="flex flex-1 justify-between gap-2">
        <div className="flex gap-2">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-2xl font-medium">
              Prepaid Balance Lag Report
            </h2>
          </div>
        </div>
        <div className="flex gap-2">
          {filterCount > 0 ? (
            <Button onClick={clearFilter}>
              {filterCount} <FilterX className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
          {table.getFilteredSelectedRowModel().rows.length > 0 ? (
            <SiteActionButton table={table} />
          ) : null}
        </div>
        <div className="flex gap-2">
          <FilterAction
            filterBody={filterBody}
            setFilterBody={setFilterBody}
            handleApplyFilters={applyFilters}
            handleClearFilter={clearFilter}
          />
          <ExportButton file_name="prepaid_balance_lag" />
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
      />
    </>
  );
}
