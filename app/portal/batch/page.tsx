import { Suspense } from 'react';
import { Heading } from '@/components/ui/heading';
import { BatchTable } from '@/components/tables/batch/batch-table';
import { fetchAllBatches } from '@/services/batches';
import { SearchParamsProps } from '@/types';
import { BatchWorkflowGuide } from '@/components/batch/batch-workflow-guide';
import { Skeleton } from '@/components/ui/skeleton';

function BatchTableFallback() {
  return (
    <div className="space-y-3 py-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

// Serves per-user batch data; also keeps the route out of static
// prerendering, which the client table's useSearchParams cannot survive.
export const dynamic = 'force-dynamic';

export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  const { data: allBatches, pageCount, totalCount } = await fetchAllBatches(searchParams);
  return (
    <div className="space-y-6">
      <Heading title="Batch Management" description="Manage all batches, bills, and recharges across postpaid, prepaid, and submeter connections" />

      {/* Workflow guide to help users understand how to create batches */}
      <BatchWorkflowGuide />

      <Suspense fallback={<BatchTableFallback />}>
        <BatchTable
          initialBody={searchParams}
          data={allBatches}
          pageCount={pageCount}
          totalCount={totalCount}
        />
      </Suspense>
    </div>
  );
}
