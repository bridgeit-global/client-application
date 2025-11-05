import { PaidTable } from '@/components/tables/payment/paid-table';
import { fetchPrepaidPaid } from '@/services/payments';
import { SearchParamsProps } from '@/types';
export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
  const { pageCount, data, totalCount } = await fetchPrepaidPaid(searchParams);
  return (
    <PaidTable
      data={data}
      pageCount={pageCount}
      totalCount={totalCount}
      payType='prepaid'
    />
  );
}
