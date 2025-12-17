'use client';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getFilterDataLength, defaultColumnSizing } from '@/lib/utils/table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
  SortingState,
  getSortedRowModel
} from '@tanstack/react-table';
import CustomTable from '@/components/custom-table';
import { Button } from '@/components/ui/button';
import { FilterX } from 'lucide-react';
import { PostpaidPaidFilterAction, PrepaidPaidFilterAction } from './filter-action';
import { prepaidColumns, postpaidColumns } from './columns';
import ExportButton from '@/components/buttons/export-button';
import { AllBillTableProps } from '@/types/bills-type';
import { createQueryString } from '@/lib/createQueryString';
import { SearchParamsProps } from '@/types';
import TableColumns from '@/components/table-columns';
import FilterChips from '@/components/filter-chip';

import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/table';
import { PrepaidRechargeTableProps } from '@/types/connections-type';

interface DataTableProps {
  data: AllBillTableProps[] | PrepaidRechargeTableProps[];
  totalCount: number;
  pageCount: number;
  payType: 'postpaid' | 'prepaid';
  searchParams?: SearchParamsProps;
}

export function PaidTable({
  data,
  pageCount,
  totalCount,
  payType
}: DataTableProps) {
  const columns = payType === 'prepaid' ? prepaidColumns : postpaidColumns;
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
    return [];
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
      const handleNavigation = async () => {
        try {
          await router.push(
            `${pathname}?${newQueryString}${currentHash}`,
            {
              scroll: false
            }
          );
          // Small delay to ensure data fetching has started
          setTimeout(() => {
            setIsLoading(false);
          }, 100);
        } catch (error) {
          setIsLoading(false);
          console.error('Navigation error:', error);
        }
      };

      handleNavigation();

      return () => {
        // Cleanup loading state if component unmounts during navigation
        setIsLoading(false);
      };
    }
  }, [pageIndex, pageSize, filterBody, sorting, router, pathname]);

  const table = useReactTable({
    data: data as any,
    columns: columns as any,
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
    columnResizeMode: 'onChange',
  });

  const clearFilter = async () => {
    setIsLoading(true);
    try {
      // Reset pagination first
      setPagination({ pageIndex: 0, pageSize: fallbackPerPage });
      // Clear the filter body and sorting
      setFilterBody({});
      setSorting([]);
      // Navigate to clean URL with only pagination params
      await router.push(
        `${pathname}?page=1&limit=${fallbackPerPage}`,
        { scroll: false }
      );
    } finally {
      setIsLoading(false);
    }
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
              Latest Payment
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {payType === 'postpaid' ? (
            <PostpaidPaidFilterAction
              handleClearFilter={clearFilter}
              handleApplyFilters={applyFilters}
              filterBody={filterBody}
              setFilterBody={setFilterBody}
            />
          ) : (
            <PrepaidPaidFilterAction
              handleClearFilter={clearFilter}
              handleApplyFilters={applyFilters}
              filterBody={filterBody}
              setFilterBody={setFilterBody}
            />
          )}
          {filterCount > 0 ? (
            <Button onClick={clearFilter}>
              {filterCount} <FilterX className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
          <ExportButton file_name={`${payType}_paid`} />
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
        columns={columns as any}
        isLoading={isLoading}
        pageSize={pageSize}
        table={table}
        totalCount={totalCount}
      />
    </>
  );
}
