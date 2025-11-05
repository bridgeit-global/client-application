'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PaginationState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel
} from '@tanstack/react-table';
import { getFilterDataLength, defaultColumnSizing } from '@/lib/utils/table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import FilterAction from './filter-action';
import CustomTable from '@/components/custom-table';
import FilterChips from '@/components/filter-chip';
import { columns } from './columns';
import { SearchParamsProps } from '@/types';
import { AllBillTableProps } from '@/types/bills-type';
import { createQueryString } from '@/lib/createQueryString';
import TableColumns from '@/components/table-columns';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/table';
import { NewBillActionButton } from './filter-action';
import ExportButton from '@/components/buttons/export-button';
import DueDateLegend from '@/components/due-date-legend';

type DataTableProps = {
  data: AllBillTableProps[];
  totalCount: number;
  pageCount: number;
  totalAmount?: number;
  searchParams?: SearchParamsProps;
};

export default function NewBillTable({
  data,
  pageCount,
  totalCount,
}: DataTableProps) {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());
  const [filterBody, setFilterBody] = useState<Record<string, string>>(params);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    params.bill_category
  );
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

    router.push(
      `${pathname}?${createQueryString(searchParams, queryParams)}${currentHash}`,
      {
        scroll: false
      }
    );
  }, [pageIndex, pageSize, filterBody, sorting, router, pathname, searchParams]);

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
    getSortedRowModel: getSortedRowModel(),
    state: {
      pagination: { pageIndex, pageSize },
      sorting,
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

  const handleCategoryChange = (value: string | undefined) => {
    setIsLoading(true);
    setSelectedCategory(value);



    const newFilterBody = { ...filterBody };
    if (value) {
      newFilterBody.bill_category = value;
    } else {
      delete newFilterBody.bill_category;
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

  const clearFilter = async () => {
    setIsLoading(true);
    // Reset pagination first
    setPagination({ pageIndex: 0, pageSize: fallbackPerPage });
    // Clear the filter body, selected category and sorting
    setFilterBody({});
    setSelectedCategory(undefined);
    setSorting([]);
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
      <div className="flex flex-1">
        <div className="flex flex-col gap-4 w-full">
          <div className="space-y-4 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  New Bills
                </h2>
                <p className="text-xs text-gray-500">Manage and approve your bills efficiently</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Quick Guide
                </h3>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 group cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                      <span className="text-xs text-blue-700 group-hover:text-blue-800 transition-colors">Filter bills by due dates using the toggle buttons below</span>
                    </li>
                    <li className="flex items-center gap-3 group cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                      <span className="text-xs text-blue-700 group-hover:text-blue-800 transition-colors">Use checkboxes to select multiple bills for bulk approval</span>
                    </li>
                    <li className="flex items-center gap-3 group cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                      <span className="text-xs text-blue-700 group-hover:text-blue-800 transition-colors">Search and filter to quickly locate specific bills</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Important Notes
                </h3>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200 shadow-sm">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 group cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      </div>
                      <span className="text-xs text-red-700 group-hover:text-red-800 transition-colors"> Light Red highlighted bills require careful review - check for abnormalities</span>
                    </li>
                    <li className="flex items-center gap-3 group cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      </div>
                      <span className="text-xs text-red-700 group-hover:text-red-800 transition-colors">Always select bills before attempting to approve them</span>
                    </li>
                    <li className="flex items-center gap-3 group cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      </div>
                      <span className="text-xs text-red-700 group-hover:text-red-800 transition-colors">Use bulk selection for efficient processing of multiple bills</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DueDateLegend />
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          <ToggleGroup
            type="single"
            value={selectedCategory}
            onValueChange={handleCategoryChange}
            className="justify-start bg-white p-2 gap-2 min-w-max"
          >
            <ToggleGroupItem
              value="overdue"
              aria-label="Overdue Bills"
              className="data-[state=on]:bg-red-100 data-[state=on]:text-red-700 data-[state=on]:border-red-200 px-4 py-2 rounded-md transition-all duration-200"
            >
              <span className="flex items-center gap-2 whitespace-nowrap">
                <div className={`w-2 h-2 rounded-full ${selectedCategory === 'overdue' ? 'bg-red-500' : 'bg-gray-300'}`} />
                Overdue
              </span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="seven_day"
              aria-label="Next 7 Days Bills"
              className="data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-700 data-[state=on]:border-yellow-200 px-4 py-2 rounded-md transition-all duration-200"
            >
              <span className="flex items-center gap-2 whitespace-nowrap">
                <div className={`w-2 h-2 rounded-full ${selectedCategory === 'seven_day' ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                Next 7 Days
              </span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="next_seven_day"
              aria-label="7-14 Days Bills"
              className="data-[state=on]:bg-green-100 data-[state=on]:text-green-700 data-[state=on]:border-green-200 px-4 py-2 rounded-md transition-all duration-200"
            >
              <span className="flex items-center gap-2 whitespace-nowrap">
                <div className={`w-2 h-2 rounded-full ${selectedCategory === 'next_seven_day' ? 'bg-green-500' : 'bg-gray-300'}`} />
                7-14 Days
              </span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {table.getFilteredSelectedRowModel().rows.length > 0 ? (
            <NewBillActionButton table={table} />
          ) : null}
          <FilterAction
            handleClearFilter={clearFilter}
            handleApplyFilters={applyFilters}
            filterBody={filterBody}
            setFilterBody={setFilterBody}
          />
          <ExportButton file_name={`new_bills`} />
          <TableColumns table={table} />
        </div>
      </div>
      <div className="my-2">
        <FilterChips
          filterBody={filterBody}
          setFilterBody={setFilterBody}
          fetchData={() => {
            setSelectedCategory(undefined);
            applyFilters();
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
