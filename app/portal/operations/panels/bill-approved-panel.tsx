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
import { Button } from '@/components/ui/button';
import { FilterX } from 'lucide-react';
import { columns } from '@/components/tables/bill/approved-bill-table/columns';
import FilterAction, {
  ApprovedBillActionButton
} from '@/components/tables/bill/approved-bill-table/filter-action';
import { BatchRecommendations } from '@/components/recommendations/BatchRecommendations';
import {
  BatchSelectionToolbar,
  QuickSelectButtons
} from '@/components/batch/batch-selection-toolbar';
import { defaultColumnSizing, getFilterDataLength } from '@/lib/utils/table';
import { useAsyncData } from '@/hooks/use-async-data';
import { getApprovedBills } from '../actions';
import { useOperationsQuery } from '../use-operations-query';
import { PanelError, PanelLoading } from '../panel-states';

type Props = { enabled: boolean };

export function BillApprovedPanel({ enabled }: Props) {
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
    () => getApprovedBills(searchParams),
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

  const rec = data?.recommendationData;

  return (
    <div className="flex w-full flex-col space-y-6">
      {rec ? (
        <BatchRecommendations
          totalBillsData={rec.totalBillsData || []}
          overdueBillsData={rec.overdueBillsData || []}
          discountDateBillsData={rec.discountDateBillsData || []}
          currentDueBillsData={rec.currentDueBillsData || []}
          nextSevenDaysBillsData={rec.nextSevenDaysBillsData || []}
        />
      ) : null}

      <div className="w-full space-y-3">
        <h3 className="text-lg md:text-xl font-semibold tracking-tight">
          Approved Bills
        </h3>
        <DueDateLegend />
        <div className="flex flex-col gap-4 justify-between lg:flex-row lg:items-center">
          <ToggleGroup
            type="single"
            value={selectedCategory}
            onValueChange={handleCategoryChange}
            className="justify-start gap-2 bg-card p-2"
          >
            <ToggleGroupItem value="overdue">Overdue</ToggleGroupItem>
            <ToggleGroupItem value="seven_day">Next 7 Days</ToggleGroupItem>
            <ToggleGroupItem value="next_seven_day">7-14 Days</ToggleGroupItem>
          </ToggleGroup>
          <div className="flex flex-wrap items-center gap-2">
            {table.getFilteredSelectedRowModel().rows.length > 0 ? (
              <ApprovedBillActionButton table={table} />
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
        <QuickSelectButtons
          items={rows}
          selectedItems={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
          onSelectItems={(items) => {
            table.getRowModel().rows.forEach((row) => {
              const shouldSelect = items.some(
                (item) => item.id === row.original.id
              );
              row.toggleSelected(shouldSelect);
            });
          }}
          onClearSelection={() => table.resetRowSelection()}
          itemType="bill"
          className="mb-4"
        />
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
        <BatchSelectionToolbar
          selectedItems={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
          totalItems={rows}
          onClearSelection={() => table.resetRowSelection()}
          itemType="bill"
          table={table}
        />
      </div>
    </div>
  );
}
