'use client';

import { useMemo } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import CustomTable from '@/components/custom-table';
import FilterChips from '@/components/filter-chip';
import TableColumns from '@/components/table-columns';
import { Button } from '@/components/ui/button';
import { FilterX } from 'lucide-react';
import { columns } from '@/components/tables/payment/batch-payment-table/columns';
import FilterAction from '@/components/tables/payment/batch-payment-table/filter-action';
import { BatchPaymentActionButton } from '@/components/tables/payment/batch-payment-table/batch-payment-action';
import { defaultColumnSizing, getFilterDataLength } from '@/lib/utils/table';
import { useAsyncData } from '@/hooks/use-async-data';
import { getBatchPayments } from '../actions';
import { useOperationsQuery } from '../use-operations-query';
import { PanelError, PanelLoading } from '../panel-states';

type Props = { enabled: boolean };

export function BatchPaymentsPanel({ enabled }: Props) {
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
    () => getBatchPayments(searchParams),
    { enabled, deps: [queryKey] }
  );

  const rows = data?.data ?? [];
  const table = useReactTable({
    data: rows,
    columns,
    pageCount: data?.pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { pagination: { pageIndex, pageSize }, sorting },
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

  if (error) return <PanelError message={error.message} onRetry={refetch} />;

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-1 flex-col justify-between gap-2 md:flex-row">
        <h3 className="text-lg md:text-xl font-semibold tracking-tight">
          Batch Payment
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <BatchPaymentActionButton table={table} />
          <FilterAction
            handleClearFilter={clearFilters}
            handleApplyFilters={applyFilters}
            filterBody={filterBody}
            setFilterBody={setFilterBody}
          />
          {filterCount > 0 ? (
            <Button variant="outline" onClick={clearFilters}>
              {filterCount} <FilterX className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
          <TableColumns table={table} />
        </div>
      </div>
      {filterCount > 0 ? (
        <FilterChips
          filterBody={filterBody}
          setFilterBody={setFilterBody}
          fetchData={applyFilters}
        />
      ) : null}
      {isLoading && !data ? (
        <PanelLoading />
      ) : (
        <CustomTable
          columns={columns}
          isLoading={isLoading}
          pageSize={pageSize}
          table={table}
          totalCount={data?.totalCount ?? 0}
        />
      )}
    </div>
  );
}
