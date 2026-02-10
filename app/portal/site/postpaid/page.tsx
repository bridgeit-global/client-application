import { ConnectionTable } from '@/components/tables/connection/connection-table';
import { getActiveConnectionsByPaytype } from '@/services/dashboard';
import { fetchAllConnections } from '@/services/sites';
import { SearchParamsProps } from '@/types';
export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  const payType = 'postpaid';
  const { count: active_count } = await getActiveConnectionsByPaytype({ paytype: 1 });

  // Default to all connections (active and inactive); use status filter to narrow down
  const modifiedSearchParams = {
    ...searchParams,
    status: searchParams.status ?? ''
  };

  const { pageCount, data, totalCount } = await fetchAllConnections(
    modifiedSearchParams,
    { pay_type: 1 }
  );

  return (
    <ConnectionTable
      payType={payType}
      data={data}
      pageCount={pageCount}
      totalCount={totalCount}
      active_count={active_count}
    />
  );
}
