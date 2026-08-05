import LowBalanceTable from '@/components/tables/bill/low-balance-table';
import { fetchLowBalanceConnections } from '@/services/bills';
import { SearchParamsProps } from '@/types';
// Request-scoped page; also avoids the useSearchParams prerender bailout.
export const dynamic = 'force-dynamic';

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
