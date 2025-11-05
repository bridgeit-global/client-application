'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
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
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { postpaidColumns, prepaidColumns } from './columns';
import ExportButton from '@/components/buttons/export-button';
import { AllBillTableProps } from '@/types/bills-type';
import { SearchParamsProps } from '@/types';
import { createQueryString } from '@/lib/createQueryString';
import TableColumns from '@/components/table-columns';

import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/table';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { PostpaidPaymentFilterAction, PrepaidPaymentFilterAction } from './filter-action';

interface DataTableProps {
  data: AllBillTableProps[] | PrepaidRechargeTableProps[];
  totalCount: number;
  pageCount: number;
  searchParams?: SearchParamsProps;
  payType: 'postpaid' | 'prepaid';
}

export function PaymentTable({
  data,
  pageCount,
  totalCount,
  payType
}: DataTableProps) {

  const columns = payType === 'postpaid' ? postpaidColumns : prepaidColumns;
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

    const handleNavigation = async () => {
      try {
        await router.push(
          `${pathname}?${createQueryString(searchParams, queryParams)}${currentHash}`,
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
  }, [pageIndex, pageSize, filterBody, sorting, router, pathname, searchParams]);

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
    columnResizeMode: 'onChange'
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

  const applyFilters = useCallback(async () => {
    setIsLoading(true);
    try {
      await router.push(
        `${pathname}?${createQueryString(searchParams, {
          ...filterBody,
          page: DEFAULT_PAGE,
          limit: DEFAULT_PAGE_SIZE
        })}`,
        {
          scroll: false
        }
      );
    } finally {
      setIsLoading(false);
    }
  }, [router, pathname, searchParams, filterBody]);

  const filterCount = useMemo(() => getFilterDataLength(filterBody), [filterBody]);

  return (
    <>
      <div className="space-y-6 py-6">
        <div className="flex flex-1 flex-col justify-between gap-2 md:flex-row">
          <div className="flex gap-2">
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-2xl font-medium">
                Payment Not Reflected on Biller Board
              </h2>
              <p className="text-sm">Check now!</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {payType === 'postpaid' ? (
              <PostpaidPaymentFilterAction
                handleClearFilter={clearFilter}
                handleApplyFilters={applyFilters}
                filterBody={filterBody}
                setFilterBody={setFilterBody}
              />
            ) : (
              <PrepaidPaymentFilterAction
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
            <ExportButton file_name={`${payType}_payment`} />
            <TableColumns table={table} />
          </div>
        </div>
        <CustomTable
          columns={columns as any}
          isLoading={isLoading}
          pageSize={pageSize}
          table={table}
          totalCount={totalCount}
        />
      </div>
    </>
  );
}
