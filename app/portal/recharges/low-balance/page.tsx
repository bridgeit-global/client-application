import LowBalanceTable from '@/components/tables/bill/low-balance-table';
import { fetchLowBalanceConnections } from '@/services/bills';
import { SearchParamsProps } from '@/types';
export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  const { pageCount, data, totalCount } = await fetchLowBalanceConnections(searchParams);
  return (
    <LowBalanceTable
      data={data}
      pageCount={pageCount}
      totalCount={totalCount}
    />
  );
}
