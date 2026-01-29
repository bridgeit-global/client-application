import { Heading } from '@/components/ui/heading';
import { BatchTable } from '@/components/tables/batch/batch-table';
import { fetchAllBatches } from '@/services/batches';
import { SearchParamsProps } from '@/types';
import { BatchWorkflowGuide } from '@/components/batch/batch-workflow-guide';

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
      
      <BatchTable
        initialBody={searchParams}
        data={allBatches}
        pageCount={pageCount}
        totalCount={totalCount}
      />
    </div>
  );
}
