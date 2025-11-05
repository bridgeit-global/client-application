import BatchPaymentTable from '@/components/tables/payment/batch-payment-table';
import { fetchBatchPayment } from '@/services/payments';
import { SearchParamsProps } from '@/types';
export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
  const { pageCount, data, totalCount } = await fetchBatchPayment(searchParams);
  return (
    <BatchPaymentTable
      data={data}
      pageCount={pageCount}
      totalCount={totalCount}
    />
  );
}
