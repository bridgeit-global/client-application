'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { columns } from '@/components/tables/batch/batch-table/columns';
import FilterAction from '@/components/tables/batch/batch-table/filter-action';
import { BatchWorkflowGuide } from '@/components/batch/batch-workflow-guide';
import { BatchFundsOverviewCard } from '@/components/cards/batch-fund-overview-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAsyncData } from '@/hooks/use-async-data';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { getBatches, getSettlementRequiredBatchCount } from '../actions';
import { OperationsTablePanel } from '../operations-table-panel';

type Props = { enabled: boolean };

function SettlementRequiredAlert({ enabled }: { enabled: boolean }) {
  const { data, refetch } = useAsyncData(
    () => getSettlementRequiredBatchCount(),
    {
      enabled,
      deps: [],
      cacheScope: 'ops:settlement-count'
    }
  );

  // Tab switches already remount + refetch (Radix unmounts inactive tab
  // content). Focus refetch covers background status changes (webhooks,
  // other sessions) while this tab stays open.
  useRefetchOnFocus(refetch);

  const count = data?.count ?? 0;
  if (count <= 0) return null;

  return (
    <Alert className="border-border bg-muted/40">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Settlement required</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {count} batch{count === 1 ? '' : 'es'} awaiting settlement.
        </span>
        <Button asChild variant="outline" size="sm">
          <Link href="/portal/operations?tab=batch-payments">
            View batch payments
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function BatchesPanel({ enabled }: Props) {
  return (
    <div className="space-y-6">
      <BatchWorkflowGuide />
      <SettlementRequiredAlert enabled={enabled} />
      <BatchFundsOverviewCard />
      <OperationsTablePanel
        enabled={enabled}
        tabId="batch-batches"
        columns={columns}
        fetcher={getBatches}
        renderFilters={({
          filterBody,
          setFilterBody,
          applyFilters,
          clearFilters
        }) => (
          <FilterAction
            filterBody={filterBody}
            setFilterBody={setFilterBody}
            handleApplyFilters={applyFilters}
            handleClearFilter={clearFilters}
          />
        )}
      />
    </div>
  );
}
