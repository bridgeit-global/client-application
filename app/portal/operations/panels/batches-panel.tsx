'use client';

import { columns } from '@/components/tables/batch/batch-table/columns';
import FilterAction from '@/components/tables/batch/batch-table/filter-action';
import { BatchWorkflowGuide } from '@/components/batch/batch-workflow-guide';
import { BatchFundsOverviewCard } from '@/components/cards/batch-fund-overview-card';
import { getBatches } from '../actions';
import { OperationsTablePanel } from '../operations-table-panel';

type Props = { enabled: boolean };

export function BatchesPanel({ enabled }: Props) {
  return (
    <div className="space-y-6">
      <BatchWorkflowGuide />
      <BatchFundsOverviewCard />
      <OperationsTablePanel
        enabled={enabled}
        title="Batches"
        description="Check now!"
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
