'use client';
import {
  PaginationState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel
} from '@tanstack/react-table';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { FilterX } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import FilterAction from './filter-action';
import { getFilterDataLength, defaultColumnSizing } from '@/lib/utils/table';
import FilterChips from '@/components/filter-chip';
import CustomTable from '@/components/custom-table';
import { columns } from './columns';
import ExportButton from '@/components/buttons/export-button';
import { AllBillTableProps } from '@/types/bills-type';
import { SearchParamsProps } from '@/types';
import { createQueryString } from '@/lib/createQueryString';
import TableColumns from '@/components/table-columns';

import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/table';

interface DataTableProps {
  data: AllBillTableProps[];
  totalCount: number;
  pageCount: number;
  searchParams?: SearchParamsProps;
}

export function BillReportTable({
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
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (params.sort && params.order) {
      return [
        {
          id: params.sort,
          desc: params.order === 'desc'
        }
      ];
    }
    // Default to sorting by bill_date in descending order (latest bills first)
    return [{ id: 'bill_date', desc: true }];
  });

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
    const fetchData = async () => {
      setIsLoading(true);
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

      const newQueryString = createQueryString(searchParams, queryParams);
      const currentQueryString = searchParams.toString();
      
      // Only navigate if the query string actually changed
      if (newQueryString !== currentQueryString) {
        await router.push(
          `${pathname}?${newQueryString}${currentHash}`,
          {
            scroll: false
          }
        );
      }

      // Set loading to false after navigation is complete
      setIsLoading(false);
    };

    fetchData();
  }, [pageIndex, pageSize, filterBody, sorting, router, pathname]);

  const table = useReactTable({
    data,
    columns: columns,
    pageCount: pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      pagination: { pageIndex, pageSize },
      sorting
    },
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
    // Clear the filter body and reset sorting to default (bill_date desc)
    setFilterBody({});
    setSorting([{ id: 'bill_date', desc: true }]);
    // Navigate to clean URL with pagination and default sorting params
    router.push(
      `${pathname}?page=1&limit=${fallbackPerPage}&sort=bill_date&order=desc`,
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
      <div className="flex flex-1 flex-col justify-between gap-2 md:flex-row">
        <div className="flex gap-2">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-2xl font-medium">
              Bills
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FilterAction
            handleClearFilter={clearFilter}
            handleApplyFilters={applyFilters}
            filterBody={filterBody}
            setFilterBody={setFilterBody}
          />
          {/* {filterCount > 0 && (
            <Button onClick={clearFilter}>
              {filterCount} <FilterX className="ml-2 h-4 w-4" />
            </Button>
          )} */}
          <ExportButton file_name="bill_report" />
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
        columns={columns}
        isLoading={isLoading}
        pageSize={pageSize}
        table={table}
        totalCount={totalCount}
      />
    </>
  );
}
