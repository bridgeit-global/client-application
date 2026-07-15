'use client';

import { useMemo, useState } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import CustomTable from '@/components/custom-table';
import FilterChips from '@/components/filter-chip';
import TableColumns from '@/components/table-columns';
import DueDateLegend from '@/components/due-date-legend';
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
  } = useOperationsQuery();

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
      <div className="space-y-1">
        <h3 className="text-lg md:text-xl font-semibold tracking-tight">
          New Bills
        </h3>
        <p className="text-sm text-muted-foreground">
          Manage and approve your bills efficiently
        </p>
      </div>
      <DueDateLegend />
      <div className="flex flex-col gap-4 justify-between lg:flex-row lg:items-center">
        <ToggleGroup
          type="single"
          value={selectedCategory}
          onValueChange={handleCategoryChange}
          className="justify-start gap-2 bg-card p-2"
        >
          <ToggleGroupItem value="overdue" aria-label="Overdue Bills">
            Overdue
          </ToggleGroupItem>
          <ToggleGroupItem value="seven_day" aria-label="Next 7 Days Bills">
            Next 7 Days
          </ToggleGroupItem>
          <ToggleGroupItem value="next_seven_day" aria-label="7-14 Days Bills">
            7-14 Days
          </ToggleGroupItem>
        </ToggleGroup>
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
