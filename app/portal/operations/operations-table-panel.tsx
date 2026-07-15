'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { FilterX } from 'lucide-react';
import CustomTable from '@/components/custom-table';
import FilterChips from '@/components/filter-chip';
import TableColumns from '@/components/table-columns';
import { getFilterDataLength, defaultColumnSizing } from '@/lib/utils/table';
import { useOperationsQuery } from './use-operations-query';
import { useAsyncData } from '@/hooks/use-async-data';
import { PanelError, PanelLoading } from './panel-states';
import { SearchParamsProps } from '@/types';

type FetchResult<T> = {
  data: T[];
  pageCount: number;
  totalCount: number;
};

type OperationsTablePanelProps<T> = {
  enabled: boolean;
  title: string;
  description?: string;
  columns: ColumnDef<T, any>[];
  fetcher: (params: SearchParamsProps) => Promise<FetchResult<T>>;
  renderFilters: (args: {
    filterBody: Record<string, string>;
    setFilterBody: React.Dispatch<
      React.SetStateAction<Record<string, string>>
    >;
    applyFilters: () => void;
    clearFilters: () => void;
  }) => ReactNode;
  toolbar?: (args: {
    table: ReturnType<typeof useReactTable<T>>;
    data: T[];
  }) => ReactNode;
  headerExtra?: ReactNode;
  belowFilters?: ReactNode;
};

export function OperationsTablePanel<T>({
  enabled,
  title,
  description,
  columns,
  fetcher,
  renderFilters,
  toolbar,
  headerExtra,
  belowFilters
}: OperationsTablePanelProps<T>) {
  const {
    filterBody,
    setFilterBody,
    sorting,
    setSorting,
    pageIndex,
    pageSize,
    setPagination,
    searchParams,
    queryKey,
    clearFilters,
    applyFilters
  } = useOperationsQuery();

  const { data, isLoading, error, refetch } = useAsyncData(
    () => fetcher(searchParams),
    { enabled, deps: [queryKey] }
  );

  const rows = data?.data ?? [];
  const pageCount = data?.pageCount ?? 0;
  const totalCount = data?.totalCount ?? 0;
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    {}
  );

  const table = useReactTable({
    data: rows,
    columns,
    pageCount: pageCount || -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      pagination: { pageIndex, pageSize },
      sorting,
      columnVisibility
    },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    defaultColumn: defaultColumnSizing,
    columnResizeMode: 'onChange'
  });

  const filterCount = useMemo(
    () => getFilterDataLength(filterBody),
    [filterBody]
  );

  // Reset loading visual when data arrives is handled by useAsyncData
  useEffect(() => {
    if (!enabled) return;
  }, [enabled]);

  if (error) {
    return <PanelError message={error.message} onRetry={refetch} />;
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-1 flex-col justify-between gap-2 md:flex-row">
        <div className="space-y-1">
          <h3 className="text-lg md:text-xl font-semibold tracking-tight">
            {title}
          </h3>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar?.({ table, data: rows })}
          {renderFilters({
            filterBody,
            setFilterBody,
            applyFilters,
            clearFilters
          })}
          {filterCount > 0 ? (
            <Button variant="outline" onClick={clearFilters}>
              {filterCount} <FilterX className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
          <TableColumns table={table} />
          {headerExtra}
        </div>
      </div>

      {filterCount > 0 ? (
        <div className="my-2">
          <FilterChips
            filterBody={filterBody}
            setFilterBody={setFilterBody}
            fetchData={applyFilters}
          />
        </div>
      ) : null}

      {belowFilters}

      {isLoading && !data ? (
        <PanelLoading />
      ) : (
        <CustomTable
          columns={columns}
          isLoading={isLoading}
          pageSize={pageSize}
          table={table}
          totalCount={totalCount}
        />
      )}
    </div>
  );
}
