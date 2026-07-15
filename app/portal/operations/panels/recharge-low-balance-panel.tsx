'use client';

import { columns } from '@/components/tables/bill/low-balance-table/columns';
import FilterAction from '@/components/tables/bill/low-balance-table/filter-action';
import ExportButton from '@/components/buttons/export-button';
import { getLowBalanceConnections } from '../actions';
import { OperationsTablePanel } from '../operations-table-panel';

type Props = { enabled: boolean };

export function RechargeLowBalancePanel({ enabled }: Props) {
  return (
    <OperationsTablePanel
      enabled={enabled}
      title="Low Balance Prepaid Connection"
      columns={columns}
      fetcher={getLowBalanceConnections}
      renderFilters={({
        filterBody,
        setFilterBody,
        applyFilters,
        clearFilters
      }) => (
        <FilterAction
          handleClearFilter={clearFilters}
          handleApplyFilters={applyFilters}
          filterBody={filterBody}
          setFilterBody={setFilterBody}
        />
      )}
      headerExtra={<ExportButton file_name="prepaid_bill" />}
    />
  );
}
