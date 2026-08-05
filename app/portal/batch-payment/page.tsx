import { Suspense } from 'react';
import BatchPaymentTable from '@/components/tables/payment/batch-payment-table';
import { fetchBatchPayment } from '@/services/payments';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchParamsProps } from '@/types';

function BatchPaymentFallback() {
  return (
    <div className="space-y-3 py-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

// Serves per-user payment data; also keeps the route out of static
// prerendering, which the client table's useSearchParams cannot survive.
export const dynamic = 'force-dynamic';

export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  const { pageCount, data, totalCount } = await fetchBatchPayment(searchParams);
  return (
    <Suspense fallback={<BatchPaymentFallback />}>
      <BatchPaymentTable
        data={data}
        pageCount={pageCount}
        totalCount={totalCount}
      />
    </Suspense>
  );
}
