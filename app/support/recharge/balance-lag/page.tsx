import { PrepaidBalanceLagTable } from '@/components/tables/connection/prepaid-balance-lag-table';
import { fetchPrepaidBalanceLag } from '@/services/sites';
import { SearchParamsProps } from '@/types';
export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
  const { pageCount, data, totalCount } = await fetchPrepaidBalanceLag(searchParams);
  return (
    <div id="prepaid-balance-lag">
      <PrepaidBalanceLagTable
        data={data}
        pageCount={pageCount}
        totalCount={totalCount}
      />
    </div>
  );
}
