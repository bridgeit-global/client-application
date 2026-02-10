'use client';

import { Button } from '@/components/ui/button';
import { FilterX, Plus } from 'lucide-react';
import { subMeterColumns, prepaidColumns, inactiveConsumerColumns } from './columns';
import FilterAction from './filter-action';
import { SiteActionButton } from './cell-action';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable
} from '@tanstack/react-table';
import { getFilterDataLength, defaultColumnSizing } from '@/lib/utils/table';
import { snakeToTitle } from '@/lib/utils/string-format';
import FilterChips from '@/components/filter-chip';
import CustomTable from '@/components/custom-table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ExportButton from '@/components/buttons/export-button';
import { SearchParamsProps } from '@/types';
import { createQueryString } from '@/lib/createQueryString';
import { ConnectionTableProps } from '@/types/connections-type';
import TableColumns from '@/components/table-columns';
import IconButton from '@/components/buttons/icon-button';

interface DataTableProps {
  payType: string;
  data: ConnectionTableProps[];
  totalCount: number;
  pageCount: number;
  searchParams?: SearchParamsProps;
  active_count?: number;
}

import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/table';

const getDefaultVisibleColumns = (payType: string) => {
  if (payType === 'postpaid') {
    return ['select', 'account_number', 'biller_board', 'site_id', 'document', 'created_at', 'actions'];
  }
  const baseColumns = ['id', 'account_number', 'site_id', 'tariff', 'security_deposit', 'bill', 'due_date', 'due_date_rebate', 'connection_date', 'created_at', 'actions', 'current_balance', 'recharge_status'];
  if (payType === 'submeter') {
    return ['id', 'tariff', 'operator_name', 'operator_mobile_number', 'created_at', 'actions'];
  }
  return baseColumns;
};

export function ConnectionTable({
  data,
  payType,
  pageCount,
  totalCount,
  active_count,
}: DataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());
  const [filterBody, setFilterBody] = useState(params);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize sorting from URL params or default for postpaid
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (payType === 'postpaid') {
      // Default to created_at desc for postpaid
      if (params.sort && params.order) {
        return [{ id: params.sort, desc: params.order === 'desc' }];
      }
      return [{ id: 'created_at', desc: true }];
    }
    if (params.sort && params.order) {
      return [{ id: params.sort, desc: params.order === 'desc' }];
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

    // Add sorting params if sorting is set
    if (sorting.length > 0) {
      queryParams.sort = sorting[0].id;
      queryParams.order = sorting[0].desc ? 'desc' : 'asc';
    } else if (payType === 'postpaid') {
      // Default sorting for postpaid
      queryParams.sort = 'created_at';
      queryParams.order = 'desc';
    }

    router.push(
      `${pathname}?${createQueryString(searchParams, queryParams)}${currentHash}`,
      { scroll: false }
    );
  }, [pageIndex, pageSize, filterBody, sorting, router, pathname, createQueryString, payType]);

  useEffect(() => {
    // Set loading to false when data arrives, regardless of whether it's empty or not
    setIsLoading(false);
  }, [data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [filterBody, pageIndex, pageSize]);

  const columns =
    payType === 'submeter'
      ? subMeterColumns
      : payType === 'postpaid'
        ? inactiveConsumerColumns
        : prepaidColumns;

  const table = useReactTable({
    data: data,
    columns,
    pageCount: pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      pagination: { pageIndex, pageSize },
      sorting
    },
    onSortingChange: (updater) => {
      setIsLoading(true);
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
    },
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
      `${pathname}?${createQueryString(searchParams, { ...filterBody, page: DEFAULT_PAGE, limit: DEFAULT_PAGE_SIZE })}`,
      {
        scroll: false
      }
    );
  }, [router, pathname, createQueryString, filterBody]);

  const filterCount = useMemo(() => getFilterDataLength(filterBody), [filterBody]);

  return (
    <>
      <div className="flex flex-1 justify-between gap-2">
        <div className="flex flex-col">
          <h2 className="text-3xl font-semibold tracking-tight">
            {snakeToTitle(payType)} Connections
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex h-2 w-2 rounded-full bg-green-500" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{active_count}</span> Active
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {table.getFilteredSelectedRowModel().rows.length > 0 ? (
            <SiteActionButton table={table} />
          ) : null}
        </div>
        <div className="flex gap-2">
          <IconButton onClick={() => router.push(`/portal/site/${payType}/create`)} icon={Plus} text="Add" />
          <FilterAction
            payType={payType}
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
          <ExportButton file_name={`${payType}_connections`} />
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
        defaultVisibleColumns={getDefaultVisibleColumns(payType)}
        isLoading={isLoading}
        columns={columns}
        pageSize={pageSize}
        table={table}
        totalCount={totalCount}
      />
    </>
  );
}
