'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PaginationState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { FilterX } from 'lucide-react';
import { getFilterDataLength, defaultColumnSizing } from '@/lib/utils/table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import FilterAction, { ApprovedBillActionButton } from './filter-action';
import CustomTable from '@/components/custom-table';
import { useBatchCartStore } from '@/lib/store/batch-cart-store';
import FilterChips from '@/components/filter-chip';
import { columns } from './columns';
import ExportButton from '@/components/buttons/export-button';
import { SearchParamsProps } from '@/types';
import { createQueryString } from '@/lib/createQueryString';
import TableColumns from '@/components/table-columns';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/table';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { BatchSelectionToolbar, QuickSelectButtons } from '@/components/batch/batch-selection-toolbar';

type DataTableProps = {
  data: PrepaidRechargeTableProps[];
  totalCount: number;
  pageCount: number;
  totalAmount?: number;
  searchParams?: SearchParamsProps;
};

export default function PrepaidApprovedTable({
  data,
  pageCount,
  totalCount
}: DataTableProps) {
  const { isClearSelectedItems } = useBatchCartStore();
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
    data,
    columns,
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

  useEffect(() => {
    table.resetRowSelection();
  }, [isClearSelectedItems]);

  return (
    <div className="w-full">
      <div className="flex flex-1 flex-col justify-between gap-2 md:flex-row">
        <div className="flex gap-2">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-2xl font-medium">
              Approved Prepaid Connection
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {table.getFilteredSelectedRowModel().rows.length > 0 ? (
            <ApprovedBillActionButton table={table} />
          ) : null}
          <FilterAction
            handleClearFilter={clearFilter}
            handleApplyFilters={applyFilters}
            filterBody={filterBody}
            setFilterBody={setFilterBody}
          />
          {filterCount > 0 ? (
            <Button onClick={clearFilter}>
              {filterCount} <FilterX className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
          <ExportButton file_name="prepaid_bill" />
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
      
      {/* Quick selection buttons for batch operations */}
      <QuickSelectButtons
        items={data}
        selectedItems={table.getFilteredSelectedRowModel().rows.map((row: any) => row.original)}
        onSelectItems={(items) => {
          // Select all matching rows in the table
          table.getRowModel().rows.forEach((row: any) => {
            const shouldSelect = items.some(item => item.id === row.original.id);
            row.toggleSelected(shouldSelect);
          });
        }}
        onClearSelection={() => table.resetRowSelection()}
        itemType="recharge"
        className="mb-4"
      />
      
      <CustomTable
        columns={columns}
        isLoading={isLoading}
        pageSize={pageSize}
        table={table}
        totalCount={totalCount}
      />
      
      {/* Selection toolbar - appears when items are selected */}
      <BatchSelectionToolbar
        selectedItems={table.getFilteredSelectedRowModel().rows.map((row: any) => row.original)}
        totalItems={data}
        onClearSelection={() => table.resetRowSelection()}
        itemType="recharge"
        table={table}
      />
    </div>
  );
}
