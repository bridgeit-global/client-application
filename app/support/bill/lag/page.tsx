import { SiteLagTable } from '@/components/tables/site/site-lag-table';
import { fetchLagSites } from '@/services/sites';
import { SearchParamsProps } from '@/types';
export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
  const { pageCount, data, totalCount } = await fetchLagSites(searchParams);
  return (
    <SiteLagTable
      data={data}
      pageCount={pageCount}
      totalCount={totalCount}
    />
  );
}
