'use client';

import {
  PaginationState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table';
import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon
} from '@radix-ui/react-icons';
import { ChevronLeftIcon, ChevronRightIcon, FilterX } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { billColumns, rechargeColumns } from './columns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFilterDataLength } from '@/lib/utils/table';
import FilterAction from './filter-action';
import FilterChips from '@/components/filter-chip';
import ExportButton from '@/components/buttons/export-button';
import { AllBillTableProps } from '@/types/bills-type';
import { createQueryString } from '@/lib/createQueryString';
import { SearchParamsProps } from '@/types';
import TableColumns from '@/components/table-columns';
import { PrepaidRechargeTableProps } from '@/types/connections-type';


interface DataTableProps {
  type: 'bill' | 'recharge';
  data: AllBillTableProps[] | PrepaidRechargeTableProps[];
  initialBody: SearchParamsProps;
  totalCount: number;
  pageCount: number;
}

const pageSizeOptions: number[] = [5, 10, 20, 30, 40, 60];

export function PaymentUpdateTable({
  type,
  data,
  initialBody,
  pageCount,
  totalCount
}: DataTableProps) {
  const columns = type === 'bill' ? billColumns : rechargeColumns;
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

  // Handle server-side pagination
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: fallbackPage - 1,
    pageSize: fallbackPerPage
  });
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    setIsLoading(true);
    const currentHash = window.location.hash;
    router.push(
      `${pathname}?${createQueryString(searchParams, {
        ...filterBody,
        page: pageIndex + 1,
        limit: pageSize
      })}${currentHash}`, // Append the hash fragment
      {
        scroll: false
      }
    );
  }, [pageIndex, pageSize, filterBody, router, pathname, createQueryString]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Add a small delay to prevent flickering

    return () => clearTimeout(timeoutId);
  }, [data]);


  const table = useReactTable({
    data: data as any,
    columns: columns as any,
    pageCount: pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination: { pageIndex, pageSize }
    },
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true
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
        page: 1,
        limit: pageSize
      })}`,
      {
        scroll: false
      }
    );
  }, [router, pathname, createQueryString, pageSize, filterBody]);

  const filterCount = getFilterDataLength(filterBody);

  return (
    <>
      <div className="flex flex-1 justify-between gap-2">
        <div className="flex gap-2">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-2xl font-medium">
              {type === 'bill' ? 'Bill Payment Update' : 'Recharge Payment Update'}
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
          {filterCount > 0 && (
            <Button onClick={clearFilter}>
              {filterCount} <FilterX className="ml-2 h-4 w-4" />
            </Button>
          )}
          <ExportButton file_name={type === 'bill' ? 'payment_update' : 'recharge_payment_update'} />
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
      <div className="flex flex-col items-center justify-end gap-2 space-x-2 py-4 text-gray-500 sm:flex-row">
        <div className="flex w-full items-center justify-between">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of {totalCount}{' '}
            row(s) selected.
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
            <div className="flex items-center space-x-2">
              <p className="whitespace-nowrap text-sm font-medium">
                Rows per page
              </p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:justify-end">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            {isLoading ? 'Loading...' : `Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              aria-label="Go to first page"
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <DoubleArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to previous page"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to next page"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to last page"
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <DoubleArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {table.getRowModel().rows.length > 0 ? (
          table.getRowModel().rows.map((row: any) => (
            <div key={row.id} className="flex justify-center">
              <Card className="w-full max-w-2xl">
                <CardHeader>
                  <CardTitle>{row.original.connections.site_id}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {row
                      .getVisibleCells()
                      .map((cell: any, cellIndex: number) => (
                        <div key={cell.id} className="space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">
                            {flexRender(
                              table.getHeaderGroups()[0].headers[cellIndex]
                                .column.columnDef.header,
                              table
                                .getHeaderGroups()[0]
                                .headers[cellIndex].getContext()
                            )}
                          </span>
                          <div className="break-words font-medium">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        ) : (
          <Card className="col-span-full w-full">
            <CardContent className="flex h-24 items-center justify-center">
              No results.
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
