import { PaidTable } from '@/components/tables/payment/paid-table';
import { fetchPostpaidPaid } from '@/services/payments';
import { SearchParamsProps } from '@/types';
export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
  const { pageCount, data, totalCount } = await fetchPostpaidPaid(searchParams);
  return (
    <PaidTable
      payType='postpaid'
      data={data}
      pageCount={pageCount}
      totalCount={totalCount}
    />
  );
}
