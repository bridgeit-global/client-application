'use client';

import { useMemo } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, FilterX } from 'lucide-react';
import CustomTable from '@/components/custom-table';
import FilterChips from '@/components/filter-chip';
import TableColumns from '@/components/table-columns';
import ExportButton from '@/components/buttons/export-button';
import FilterAction from '@/components/tables/payment/wallet-table/filter-action';
import { getWalletColumns } from '@/components/tables/payment/wallet-table/columns';
import { formatRupees } from '@/lib/utils/number-format';
import { defaultColumnSizing, getFilterDataLength } from '@/lib/utils/table';
import { useUtilizeAndThresholdAmount } from '@/hooks/use-utilize-amount';
import { useAsyncData } from '@/hooks/use-async-data';
import { getWalletStatement } from '../actions';
import { useOperationsQuery } from '../use-operations-query';
import { PanelError, PanelLoading } from '../panel-states';

type Props = { enabled: boolean };

export function StatementPanel({ enabled }: Props) {
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
    () => getWalletStatement(searchParams),
    { enabled, deps: [queryKey] }
  );

  const columns = getWalletColumns('portal');
  const {
    thresholdAmount,
    utilizeAmount,
    isLoading: isUtilizeLoading
  } = useUtilizeAndThresholdAmount();

  const availableLimit = useMemo(
    () => Math.max(thresholdAmount - utilizeAmount, 0),
    [thresholdAmount, utilizeAmount]
  );
  const availableLimitClass =
    thresholdAmount - utilizeAmount >= 0 ? 'text-green-500' : 'text-red-500';

  const rows = data?.data ?? [];
  const summary = data?.summary ?? {
    credits: 0,
    debits: 0,
    balance: 0,
    count: 0
  };
  const pendingAmount = data?.pendingAmount ?? 0;

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
  if (isLoading && !data) return <PanelLoading rows={6} />;

  return (
    <div className="space-y-4 p-1">
      <div className="mb-4 flex items-center gap-2">
        <Wallet className="h-6 w-6 text-primary" />
        <h3 className="text-lg md:text-xl font-semibold tracking-tight">
          Statement
        </h3>
      </div>

      <Card>
        <CardContent className="flex justify-between pt-6">
          <div className="w-1/2 rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground">Available Limit</div>
            <div className={`mb-1 text-3xl font-bold ${availableLimitClass}`}>
              {isUtilizeLoading ? '—' : formatRupees(availableLimit)}
            </div>
          </div>
          <div className="w-1/2 rounded-lg p-4 text-center text-destructive">
            <div className="text-sm opacity-90">Pending for Payment</div>
            <div className="mb-1 text-3xl font-bold">
              {formatRupees(pendingAmount)}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <div className="mb-1 flex items-center justify-center gap-1">
            <TrendingUp className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">Total Paid to BridgeIT</span>
          </div>
          <div className="text-lg font-bold text-destructive">
            {formatRupees(summary.credits)}
          </div>
        </Card>
        <Card className="p-3 text-center">
          <div className="mb-1 flex items-center justify-center gap-1">
            <TrendingDown className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Total Pay for Biller</span>
          </div>
          <div className="text-lg font-bold text-green-600">
            {formatRupees(summary.debits)}
          </div>
        </Card>
        <Card className="p-3 text-center">
          <div className="mb-1 text-sm font-medium">Total Transactions</div>
          <div className="text-lg font-bold text-primary">
            {data?.totalCount ?? 0}
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FilterAction
            filterBody={filterBody}
            setFilterBody={setFilterBody}
            handleApplyFilters={applyFilters}
            handleClearFilter={clearFilters}
          />
          {filterCount > 0 ? (
            <Button onClick={clearFilters} variant="outline">
              {filterCount} <FilterX className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <ExportButton file_name="portal_statement" />
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

      <CustomTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        pageSize={pageSize}
        totalCount={data?.totalCount ?? 0}
      />
    </div>
  );
}
