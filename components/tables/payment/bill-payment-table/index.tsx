'use client';

import {
  PaginationState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable
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
import { ClientPaymentsProps } from '@/types/payments-type';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { set_cptable } from 'xlsx';

interface DataTableProps {
  data: ClientPaymentsProps[];
  totalCount: number;
  pageSizeOptions?: number[];
  pageCount: number;
  searchParams?: SearchParamsProps;
}

export function BillPaymentTable({
  data,
  pageCount,
  totalCount,
}: DataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());
  const [filterBody, setFilterBody] = useState(params);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    params.status
  );

  const handleCategoryChange = (value: string | undefined) => {
    setIsLoading(true);
    setSelectedCategory(value);

    const newFilterBody = { ...filterBody };
    if (value) {
      newFilterBody.status = value;
    } else {
      delete newFilterBody.status;
    }

    setFilterBody(newFilterBody);
    router.push(
      `${pathname}?${createQueryString(searchParams, {
        ...newFilterBody,
        page: '1',
        limit: String(pageSize)
      })}`,
      {
        scroll: false
      }
    );
  };

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
    // Clear the filter body, selected category and sorting
    setFilterBody({});
    setSelectedCategory(undefined);
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

  return (
    <>
      <div className="flex flex-1 justify-between gap-2">
        <div className="flex gap-2">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-2xl font-medium">
              Bill & Recharge Payments
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
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          <ToggleGroup
            type="single"
            value={selectedCategory}
            onValueChange={handleCategoryChange}
            className="justify-start bg-white p-2 gap-2 min-w-max"
          >

            <ToggleGroupItem
              value="unpaid"
              aria-label="Unpaid Payments"
              className="data-[state=on]:bg-orange-100 data-[state=on]:text-orange-700 data-[state=on]:border-orange-200 px-4 py-2 rounded-md transition-all duration-200"
            >
              <span className="flex items-center gap-2 whitespace-nowrap">
                <div className={`w-2 h-2 rounded-full ${selectedCategory === 'unpaid' ? 'bg-orange-500' : 'bg-gray-300'}`} />
                Unpaid
              </span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="paid"
              aria-label="Paid Payments"
              className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 data-[state=on]:border-blue-200 px-4 py-2 rounded-md transition-all duration-200"
            >
              <span className="flex items-center gap-2 whitespace-nowrap">
                <div className={`w-2 h-2 rounded-full ${selectedCategory === 'paid' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                Paid
              </span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="reverse"
              aria-label="Reversed Payments"
              className="data-[state=on]:bg-purple-100 data-[state=on]:text-purple-700 data-[state=on]:border-purple-200 px-4 py-2 rounded-md transition-all duration-200"
            >
              <span className="flex items-center gap-2 whitespace-nowrap">
                <div className={`w-2 h-2 rounded-full ${selectedCategory === 'reverse' ? 'bg-purple-500' : 'bg-gray-300'}`} />
                Reverse
              </span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="refund"
              aria-label="Refunded Payments"
              className="data-[state=on]:bg-indigo-100 data-[state=on]:text-indigo-700 data-[state=on]:border-indigo-200 px-4 py-2 rounded-md transition-all duration-200"
            >
              <span className="flex items-center gap-2 whitespace-nowrap">
                <div className={`w-2 h-2 rounded-full ${selectedCategory === 'refund' ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                Refund
              </span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="failed"
              aria-label="Failed Payments"
              className="data-[state=on]:bg-gray-100 data-[state=on]:text-gray-700 data-[state=on]:border-gray-200 px-4 py-2 rounded-md transition-all duration-200"
            >
              <span className="flex items-center gap-2 whitespace-nowrap">
                <div className={`w-2 h-2 rounded-full ${selectedCategory === 'failed' ? 'bg-red-500' : 'bg-gray-300'}`} />
                Failed
              </span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <div className="my-2">
        <FilterChips
          filterBody={filterBody}
          setFilterBody={setFilterBody}
          fetchData={() => {
            applyFilters();
            setSelectedCategory(undefined);
          }}
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
