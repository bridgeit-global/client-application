'use client';

import { useMemo } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table';
import CustomTable from '@/components/custom-table';
import FilterChips from '@/components/filter-chip';
import TableColumns from '@/components/table-columns';
import ExportButton from '@/components/buttons/export-button';
import { Button } from '@/components/ui/button';
import { FilterX } from 'lucide-react';
import { columns } from '@/components/tables/bill/prepaid-approved-table/columns';
import FilterAction, {
  ApprovedBillActionButton
} from '@/components/tables/bill/prepaid-approved-table/filter-action';
import { PrepaidBatchRecommendations } from '@/components/recommendations/PrepaidBatchRecommendations';
import {
  BatchSelectionToolbar,
  QuickSelectButtons
} from '@/components/batch/batch-selection-toolbar';
import { defaultColumnSizing, getFilterDataLength } from '@/lib/utils/table';
import { useAsyncData } from '@/hooks/use-async-data';
import { getApprovedRecharges } from '../actions';
import { useOperationsQuery } from '../use-operations-query';
import { PanelError, PanelLoading } from '../panel-states';

type Props = { enabled: boolean };

export function RechargeApprovedPanel({ enabled }: Props) {
  const {
    filterBody,
    setFilterBody,
    pageIndex,
    pageSize,
    setPagination,
    searchParams,
    queryKey,
    clearFilters,
    applyFilters
  } = useOperationsQuery();

  const { data, isLoading, error, refetch } = useAsyncData(
    () => getApprovedRecharges(searchParams),
    { enabled, deps: [queryKey] }
  );

  const rows = data?.data ?? [];
  const table = useReactTable({
    data: rows,
    columns,
    pageCount: data?.pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { pagination: { pageIndex, pageSize } },
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    defaultColumn: defaultColumnSizing,
    columnResizeMode: 'onChange'
  });

  const filterCount = useMemo(
    () => getFilterDataLength(filterBody),
    [filterBody]
  );

  if (error) return <PanelError message={error.message} onRetry={refetch} />;

  const rec = data?.recommendationData;

  return (
    <div className="flex w-full flex-col space-y-6">
      {rec ? (
        <PrepaidBatchRecommendations
          nextSevenDaysRechargesData={rec.nextSevenDaysRechargesData || []}
          totalRechargesData={rec.totalRechargesData || []}
          currentDueRechargesData={rec.currentDueRechargesData || []}
        />
      ) : null}

      <div className="w-full space-y-3">
        <div className="flex flex-1 flex-col justify-between gap-2 md:flex-row">
          <h3 className="text-lg md:text-xl font-semibold tracking-tight">
            Approved Prepaid Connection
          </h3>
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
            <ExportButton file_name="prepaid_bill" />
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
          itemType="recharge"
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
          itemType="recharge"
          table={table}
        />
      </div>
    </div>
  );
}
