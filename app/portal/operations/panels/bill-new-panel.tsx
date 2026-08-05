'use client';

import { useMemo, useState } from 'react';
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
import ExportButton from '@/components/buttons/export-button';
import { Button } from '@/components/ui/button';
import { FilterX } from 'lucide-react';
import { columns } from '@/components/tables/bill/new-bill-table/columns';
import FilterAction, {
  NewBillActionButton
} from '@/components/tables/bill/new-bill-table/filter-action';
import { defaultColumnSizing, getFilterDataLength } from '@/lib/utils/table';
import { useAsyncData } from '@/hooks/use-async-data';
import { getNewBills } from '../actions';
import { useOperationsQuery } from '../use-operations-query';
import { DueDateCategoryFilters } from '../due-date-category-filters';
import { PanelError, PanelLoading } from '../panel-states';

type Props = { enabled: boolean };

export function BillNewPanel({ enabled }: Props) {
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
  } = useOperationsQuery({}, { forTab: 'bill-new' });

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    filterBody.bill_category
  );

  const { data, isLoading, error, refetch } = useAsyncData(
    () => getNewBills(searchParams),
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

  const handleCategoryChange = (value: string | undefined) => {
    setSelectedCategory(value);
    setFilterBody((prev) => {
      const next = { ...prev };
      if (value) next.bill_category = value;
      else delete next.bill_category;
      return next;
    });
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  if (error) return <PanelError message={error.message} onRetry={refetch} />;

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col gap-4 justify-between lg:flex-row lg:items-center">
        <DueDateCategoryFilters
          value={selectedCategory}
          onValueChange={handleCategoryChange}
        />
        <div className="flex flex-wrap items-center gap-2">
          {table.getFilteredSelectedRowModel().rows.length > 0 ? (
            <NewBillActionButton table={table} />
          ) : null}
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
          <ExportButton file_name="new_bills" />
          <TableColumns table={table} />
        </div>
      </div>
      {filterCount > 0 ? (
        <FilterChips
          filterBody={filterBody}
          setFilterBody={setFilterBody}
          fetchData={() => {
            setSelectedCategory(undefined);
            applyFilters();
          }}
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
