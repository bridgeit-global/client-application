'use client';

import {
  PaginationState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  VisibilityState,
  SortingState,
  getSortedRowModel
} from '@tanstack/react-table';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { columns } from './columns';
import CustomTable from '@/components/custom-table';
import FilterChips from '@/components/filter-chip';
import FilterAction from './filter-action';
import { FilterX } from 'lucide-react';
import { getFilterDataLength, defaultColumnSizing } from '@/lib/utils/table';
import { Button } from '@/components/ui/button';
import ExportButton from '@/components/buttons/export-button';
import { SearchParamsProps } from '@/types';
import { createQueryString } from '@/lib/createQueryString';
import TableColumns from '@/components/table-columns';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/table';
import { PaymentGatewayTransactionsProps } from '@/types/payments-type';
import PendingPaymentCard from './PendingPaymentCard';

interface DataTableProps {
  data: PaymentGatewayTransactionsProps[];
  totalCount: number;
  pageSizeOptions?: number[];
  pageCount: number;
  searchParams?: SearchParamsProps;
  status: 'pending' | 'others';
  initialBody: SearchParamsProps;
}



export function TransactionTable({
  data,
  pageCount,
  totalCount,
  status,
  initialBody
}: DataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filterBody, setFilterBody] = useState(initialBody);
  const [isLoading, setIsLoading] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const params = Object.fromEntries(searchParams.entries());

  // Sorting state
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
        `${pathname}?${createQueryString(searchParams, { [status]: queryParams })}${currentHash}`,
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

  // Hash navigation effect
  useEffect(() => {
    if (window.location.hash) {
      const element = document.querySelector(window.location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

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
    setPagination({ pageIndex: 0, pageSize: fallbackPerPage });
    setFilterBody({});
    setSorting([]);
    try {
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
        `${pathname}?${createQueryString(searchParams, { [status]: queryParams })}`,
        {
          scroll: false
        }
      );
    } finally {
      setIsLoading(false);
    }
  }, [router, pathname, filterBody, sorting]);

  const filterCount = useMemo(() => getFilterDataLength(filterBody), [filterBody]);

  return (
    <>
      <div className="flex flex-1 justify-between gap-2">
        <div className="flex gap-2">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-2xl font-medium">
              {status === 'pending' ? 'Pending' : ''} Payments
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
          <ExportButton file_name="bill_payments" />
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
      {status === 'pending' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {data.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-8">No pending payments found.</div>
          ) : (
            data.map((transaction) => (
              <PendingPaymentCard key={transaction.transaction_reference} transaction={transaction} />
            ))
          )}
        </div>
      ) : (
        <CustomTable
          columns={columns}
          isLoading={isLoading}
          pageSize={pageSize}
          table={table}
          totalCount={totalCount}
        />
      )}
    </>
  );
}
