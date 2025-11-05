'use client';
import { Button } from '@/components/ui/button';
import { FilterX, IndianRupeeIcon, RefreshCw } from 'lucide-react';
import FilterAction from './filter-action';
import React, { useCallback, useEffect, useState } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
  SortingState,
  getSortedRowModel
} from '@tanstack/react-table';
import { getFilterDataLength, defaultColumnSizing } from '@/lib/utils/table';
import FilterChips from '@/components/filter-chip';
import CustomTable from '@/components/custom-table';
import { postpaidColumns, prepaidColumns } from './columns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchParamsProps } from '@/types';
import { createQueryString } from '@/lib/createQueryString';
import { AllBillTableProps } from '@/types/bills-type';
import TableColumns from '@/components/table-columns';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import ExportButton from '@/components/buttons/export-button';

type DataTableProps = {
  data: AllBillTableProps[] | PrepaidRechargeTableProps[];
  initialBody: SearchParamsProps;
  totalCount: number;
  pageCount: number;
  searchParams?: SearchParamsProps;
  payType: 'postpaid' | 'prepaid' | 'submeter';
};

export function BatchItemTable({
  data,
  initialBody,
  pageCount,
  totalCount,
  payType,
}: DataTableProps) {
  const columns = payType === 'prepaid' ? prepaidColumns : postpaidColumns;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filterBody, setFilterBody] = useState(initialBody);

  // Search params
  const page = initialBody?.page;
  const perPage = initialBody?.limit;
  const pageAsNumber = Number(page);
  const fallbackPage =
    isNaN(pageAsNumber) || pageAsNumber < 1 ? 1 : pageAsNumber;
  const perPageAsNumber = Number(perPage);
  const fallbackPerPage = isNaN(perPageAsNumber) ? 10 : perPageAsNumber;

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (initialBody?.sort && initialBody?.order) {
      return [
        {
          id: initialBody.sort,
          desc: initialBody.order === 'desc'
        }
      ];
    }
    return [];
  });

  // Handle server-side pagination
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: fallbackPage - 1,
    pageSize: fallbackPerPage
  });

  // Sync pagination and sorting state with URL parameters
  useEffect(() => {
    setIsLoading(true);
    const currentHash = window.location.hash;
    // Build query params for sorting
    let filter: any = {
      ...filterBody,
      page: pageIndex + 1,
      limit: pageSize
    };
    if (sorting.length > 0) {
      filter.sort = sorting[0].id;
      filter.order = sorting[0].desc ? 'desc' : 'asc';
    }
    router.push(
      `${pathname}?${createQueryString(searchParams, {
        [payType]: filter
      })}${currentHash}`,
      {
        scroll: false
      }
    );
  }, [pageIndex, pageSize, filterBody, sorting, router, pathname, searchParams, payType]);

  useEffect(() => {
    setIsLoading(false);
  }, [data]);

  const [isLoading, setIsLoading] = useState(false);

  const table = useReactTable({
    data: data as any,
    columns: columns as any,
    pageCount: pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(payType === 'postpaid' && { getSortedRowModel: getSortedRowModel() }),
    state: {
      pagination: { pageIndex, pageSize },
      ...(payType === 'postpaid' && { sorting })
    },
    onSortingChange: payType === 'postpaid' ? setSorting : undefined,
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    ...(payType === 'postpaid' && { manualSorting: true }),
    defaultColumn: defaultColumnSizing,
    columnResizeMode: 'onChange'
  });

  const clearFilter = useCallback(() => {
    setFilterBody({});
  }, []);

  const applyFilters = useCallback(() => {
    router.push(
      `${pathname}?${createQueryString(searchParams, {
        [payType]: {
          page: 1,
          limit: pageSize,
          ...filterBody
        }
      })}`,
      {
        scroll: false
      }
    );
  }, [router, pathname, createQueryString, pageSize, filterBody]);

  const filterCount = getFilterDataLength(filterBody);

  return (
    <>
      <div className="flex flex-1 flex-col justify-between gap-2 md:flex-row">
        <div className="flex gap-2">
          <div className="space-y-2">
            <h2 className="flex flex-col gap-2 text-2xl font-medium md:flex-row">
              <span>{payType === 'postpaid' ? 'Bills' : 'Recharges'}</span>
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <ExportButton file_name={`${payType === 'prepaid' ? 'recharges' : 'bills'}_in_batches`} />
          <FilterAction
            filterBody={filterBody}
            setFilterBody={setFilterBody}
            handleApplyFilters={applyFilters}
            handleClearFilter={clearFilter}
          />
          {filterCount > 0 ? (
            <Button onClick={clearFilter} variant="outline" aria-label="Clear filters">
              {filterCount} <FilterX className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
          <TableColumns table={table} />
        </div>
      </div>
      <FilterChips
        filterBody={filterBody}
        setFilterBody={setFilterBody}
        fetchData={applyFilters}
      />
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
