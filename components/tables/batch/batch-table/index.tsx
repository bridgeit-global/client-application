'use client';
import { Button } from '@/components/ui/button';
import { FilterX } from 'lucide-react';
import FilterAction from './filter-action';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
  VisibilityState,
  SortingState,
  getSortedRowModel
} from '@tanstack/react-table';
import { getFilterDataLength, defaultColumnSizing } from '@/lib/utils/table';
import FilterChips from '@/components/filter-chip';
import CustomTable from '@/components/custom-table';
import { columns } from './columns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BatchTableProps } from '@/types/batches-type';
import { SearchParamsProps } from '@/types';
import { createQueryString } from '@/lib/createQueryString';
import TableColumns from '@/components/table-columns';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/table';
import { BatchFundsOverviewCard } from '@/components/cards/batch-fund-overview-card';

type DataTableProps = {
  data: BatchTableProps[];
  totalCount: number;
  pageCount: number;
  initialBody: SearchParamsProps;
  searchParams?: SearchParamsProps;
};



export function BatchTable({
  data,
  pageCount,
  totalCount,
  initialBody,
}: DataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filterBody, setFilterBody] = useState(initialBody);
  const [isLoading, setIsLoading] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const params = Object.fromEntries(searchParams.entries());

  // Add sorting state
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (params.sort && params.order) {
      return [
        {
          id: params.sort,
          desc: params.order === 'desc'
        }
      ];
    }
    return [];
  });

  // Search params
  const page = initialBody?.page || DEFAULT_PAGE;
  const perPage = initialBody?.limit || DEFAULT_PAGE_SIZE;
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
    const currentHash = window.location.hash;
    const queryParams: Record<string, string> = {
      ...filterBody,
      page: String(pageIndex + 1),
      limit: String(pageSize)
    };

    if (sorting.length > 0) {
      queryParams.sort = sorting[0].id;
      queryParams.order = sorting[0].desc ? 'desc' : 'asc';
    }

    setIsLoading(true);
    try {
      router.push(
        `${pathname}?${createQueryString(searchParams, queryParams)}${currentHash}`,
        {
          scroll: false
        }
      );
    } catch (error) {
      console.error('Error updating URL:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, filterBody, sorting]);

  useEffect(() => {
    if (data.length === 0) {
      setIsLoading(false);
    }
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      pagination: { pageIndex, pageSize },
      columnVisibility,
      sorting
    },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      setIsLoading(true);
      setPagination(updater);
    },
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    defaultColumn: defaultColumnSizing,
    columnResizeMode: 'onChange'
  });

  const clearFilter = async () => {
    setIsLoading(true);
    // Reset pagination first
    setPagination({ pageIndex: 0, pageSize: fallbackPerPage });
    // Clear the filter body and sorting
    setFilterBody({});
    setSorting([]);
    try {
      // Navigate to clean URL with only pagination params
      await router.push(
        `${pathname}?page=1&limit=${fallbackPerPage}`,
        { scroll: false }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams: Record<string, string> = {
        ...filterBody,
        page: String(DEFAULT_PAGE),
        limit: String(DEFAULT_PAGE_SIZE)
      };

      if (sorting.length > 0) {
        queryParams.sort = sorting[0].id;
        queryParams.order = sorting[0].desc ? 'desc' : 'asc';
      }

      await router.push(
        `${pathname}?${createQueryString(searchParams, queryParams)}`,
        {
          scroll: false
        }
      );
    } finally {
      setIsLoading(false);
    }
  }, [router, pathname, filterBody, sorting, searchParams]);

  // Add useEffect to handle hash navigation
  React.useEffect(() => {
    // Check if there's a hash in the URL
    if (window.location.hash) {
      const element = document.querySelector(window.location.hash);
      if (element) {
        // Add a small delay to ensure content is rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  const filterCount = useMemo(() => getFilterDataLength(filterBody), [filterBody]);

  return (
    <>
      {/* Available/Threshold Amount Card */}
      <BatchFundsOverviewCard />
      {/* End Available/Threshold Amount Card */}
      <div className="flex flex-1 flex-col justify-between gap-2 md:flex-row">
        <div className="flex gap-2">
          <div className="space-y-2">
            <h2 className="flex flex-col gap-2 text-2xl font-medium md:flex-row">
              <span>Batches</span>
            </h2>
            <p className="text-sm">Check now!</p>
          </div>
        </div>
        <div className="flex gap-2">
          <FilterAction
            filterBody={filterBody}
            setFilterBody={setFilterBody}
            handleApplyFilters={applyFilters}
            handleClearFilter={clearFilter}
          />
          {filterCount > 0 ? (
            <Button onClick={clearFilter}>
              {filterCount} <FilterX className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
          <TableColumns table={table} />
        </div>
      </div>
      {
        filterCount > 0 && (
          <div className="my-2">
            <FilterChips
              filterBody={filterBody}
              setFilterBody={setFilterBody}
              fetchData={applyFilters}
            />
          </div>
        )
      }
      <CustomTable
        columns={columns}
        isLoading={isLoading}
        pageSize={pageSize}
        table={table}
        totalCount={totalCount}
      />
    </>
  );
}
