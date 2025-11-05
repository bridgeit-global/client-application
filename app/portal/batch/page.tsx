import { Heading } from '@/components/ui/heading';
import { BatchTable } from '@/components/tables/batch/batch-table';
import { fetchAllBatches } from '@/services/batches';
import { SearchParamsProps } from '@/types';

export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
  const { data: allBatches, pageCount, totalCount } = await fetchAllBatches(searchParams);
  return (
    <div className="space-y-8">
      <Heading title="Batch Management" description="Manage all batches, bills, and recharges across postpaid, prepaid, and submeter connections" />
      <BatchTable
        initialBody={searchParams}
        data={allBatches}
        pageCount={pageCount}
        totalCount={totalCount}
      />
    </div>
  );
}
