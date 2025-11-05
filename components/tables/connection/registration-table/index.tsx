'use client';

import {
  PaginationState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table';
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, FilterX } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { columns } from './columns';
import FilterAction from './filter-action';
import { getFilterDataLength, defaultColumnSizing } from '@/lib/utils/table';
import FilterChips from '@/components/filter-chip';
import CustomTable from '@/components/custom-table';
import { SiteBulkForm } from '@/components/forms/support-form/site-bulk-form';
import ExportButton from '@/components/buttons/export-button';
import { SearchParamsProps } from '@/types';
import { createQueryString } from '@/lib/createQueryString';
import { RegistrationsProps } from '@/types/registrations-type';
import TableColumns from '@/components/table-columns';
import { Separator } from '@/components/ui/separator';
import { useSiteName } from '@/lib/utils/site';

interface DataTableProps<TData, TValue> {
  data: RegistrationsProps[];
  initialBody: SearchParamsProps;
  totalCount: number;
  pageCount: number;
  searchParams?: SearchParamsProps;
}

export function RegistrationTable<TData, TValue>({
  data,
  initialBody,
  pageCount,
  totalCount
}: DataTableProps<TData, TValue>) {
  const site_name = useSiteName();
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
        filter: {
          ...filterBody,
          page: pageIndex + 1,
          limit: pageSize
        }
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

  useEffect(() => {
    // Check if there's a hash in the URL
    if (window.location.hash) {
      const element = document.querySelector(window.location.hash);
      if (element) {
        // Add a small delay to ensure content is rendered
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
    state: {
      pagination: { pageIndex, pageSize }
    },
    onPaginationChange: setPagination,
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
        filter: {
          ...filterBody,
          page: 1,
          limit: pageSize
        }
      })}`,
      {
        scroll: false
      }
    );
  }, [router, pathname, createQueryString, pageSize, filterBody]);

  const [isRegisterSite, setIsRegisterSite] = useState(false);
  const toggleIsRegisterSite = () => setIsRegisterSite(!isRegisterSite);
  const filterCount = getFilterDataLength(filterBody);
  return (
    <>
      <div className="flex items-center justify-end">
        <Button className="mb-4" onClick={toggleIsRegisterSite}>
          {!isRegisterSite ? (
            <ArrowDown className="mr-2 h-4 w-4" />
          ) : (
            <ArrowUp className="mr-2 h-4 w-4" />
          )}
          Create {site_name}
        </Button>
      </div>

      {isRegisterSite ? (
        <div className="space-y-4">
          <SiteBulkForm initialData={null} />
        </div>
      ) : null}
      <Separator className='my-2 mt-4' />
      <div className="flex flex-1 justify-between gap-2">
        <div className="flex gap-2">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-2xl font-medium">
              Registration Logs
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
          <ExportButton file_name="registration_failed" />
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
