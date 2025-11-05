'use client';

import { Button } from '@/components/ui/button';
import { FilterX, Plus } from 'lucide-react';
import { subMeterColumns, prepaidColumns, postpaidColumns } from './columns';
import FilterAction from './filter-action';
import { SiteActionButton } from './cell-action';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
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
  const baseColumns = ['id', 'account_number', 'site_id', 'tariff', 'security_deposit', 'bill', 'due_date', 'due_date_rebate', 'connection_date', 'created_at', 'actions', 'current_balance', 'recharge_status'];
  
  if (payType === 'submeter') {
    // Add operator columns for submeter
    return ['id', 'tariff', 'operator_name', 'operator_mobile_number', 'created_at', 'actions'];
  }
  
  return baseColumns;
};

export function ConnectionTable({
  data,
  payType,
  pageCount,
  totalCount,
  active_count
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
      { scroll: false }
    );
  }, [pageIndex, pageSize, filterBody, router, pathname, createQueryString]);

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

  const table = useReactTable({
    data: data,
    columns: payType === 'submeter' ? subMeterColumns : payType === 'postpaid' ? postpaidColumns : prepaidColumns,
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
        columns={payType === 'submeter' ? subMeterColumns : payType === 'postpaid' ? postpaidColumns : prepaidColumns}
        pageSize={pageSize}
        table={table}
        totalCount={totalCount}
      />
    </>
  );
}
