'use client';

import {
  prepaidColumns,
  postpaidColumns
} from '@/components/tables/payment/paid-table/columns';
import {
  PostpaidPaidFilterAction,
  PrepaidPaidFilterAction
} from '@/components/tables/payment/paid-table/filter-action';
import ExportButton from '@/components/buttons/export-button';
import { getBillsPaid, getRechargesPaid } from '../actions';
import { OperationsTablePanel } from '../operations-table-panel';

type Props = { enabled: boolean };

export function BillsPaidPanel({ enabled }: Props) {
  return (
    <OperationsTablePanel
      enabled={enabled}
      title="Latest Payment"
      description="Bills paid"
      columns={postpaidColumns as any}
      fetcher={getBillsPaid}
      renderFilters={({
        filterBody,
        setFilterBody,
        applyFilters,
        clearFilters
      }) => (
        <PostpaidPaidFilterAction
          handleClearFilter={clearFilters}
          handleApplyFilters={applyFilters}
          filterBody={filterBody}
          setFilterBody={setFilterBody}
        />
      )}
      headerExtra={<ExportButton file_name="postpaid_paid" />}
    />
  );
}

export function RechargesPaidPanel({ enabled }: Props) {
  return (
    <OperationsTablePanel
      enabled={enabled}
      title="Latest Payment"
      description="Recharges paid"
      columns={prepaidColumns as any}
      fetcher={getRechargesPaid}
      renderFilters={({
        filterBody,
        setFilterBody,
        applyFilters,
        clearFilters
      }) => (
        <PrepaidPaidFilterAction
          handleClearFilter={clearFilters}
          handleApplyFilters={applyFilters}
          filterBody={filterBody}
          setFilterBody={setFilterBody}
        />
      )}
      headerExtra={<ExportButton file_name="prepaid_paid" />}
    />
  );
}
