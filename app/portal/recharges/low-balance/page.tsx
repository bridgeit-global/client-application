import LowBalanceTable from '@/components/tables/bill/low-balance-table';
import { fetchLowBalanceConnections } from '@/services/bills';
import { SearchParamsProps } from '@/types';
export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
  const { pageCount, data, totalCount } = await fetchLowBalanceConnections(searchParams);
  return (
    <LowBalanceTable
      data={data}
      pageCount={pageCount}
      totalCount={totalCount}
    />
  );
}
