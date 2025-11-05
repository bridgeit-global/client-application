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
import { Button } from '@/components/ui/button';
import { FilterX } from 'lucide-react';
import { getFilterDataLength, defaultColumnSizing } from '@/lib/utils/table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import FilterAction from './filter-action';
import CustomTable from '@/components/custom-table';
import { useBatchCartStore } from '@/lib/store/batch-cart-store';
import FilterChips from '@/components/filter-chip';
import { columns } from './columns';
import { SearchParamsProps } from '@/types';
import { AllBillTableProps } from '@/types/bills-type';
import { createQueryString } from '@/lib/createQueryString';
import TableColumns from '@/components/table-columns';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/table';
import { ApprovedBillActionButton } from './filter-action';
import DueDateLegend from '@/components/due-date-legend';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type DataTableProps = {
  data: AllBillTableProps[];
  totalCount: number;
  pageCount: number;
  totalAmount?: number;
  searchParams?: SearchParamsProps;
};

export default function ApprovedBillTable({
  data,
  pageCount,
  totalCount,
}: DataTableProps) {
  const { isClearSelectedItems } = useBatchCartStore();
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
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    params.bill_category
  );

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

  useEffect(() => {
    table.resetRowSelection();
  }, [isClearSelectedItems]);

  return (
    <div className="w-full">
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
            <ApprovedBillActionButton table={table} />
          ) : null}
          <FilterAction
            handleClearFilter={clearFilter}
            handleApplyFilters={applyFilters}
            filterBody={filterBody}
            setFilterBody={setFilterBody}
          />
          {filterCount > 0 ? (
            <Button onClick={clearFilter} className="w-full sm:w-auto">
              {filterCount} <FilterX className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
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
    </div>
  );
}
