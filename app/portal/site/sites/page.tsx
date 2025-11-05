import { SiteTable } from '@/components/tables/site/site-table';
import { fetchAllSites } from '@/services/sites';
import { SearchParamsProps } from '@/types';
import { getActiveSites } from '@/services/dashboard';
export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
  const { count: active_count } = await getActiveSites();
  // Default to showing only active sites if no status filter is provided
  const modifiedSearchParams = {
    ...searchParams,
    status: searchParams.status || '1'
  };
  const { pageCount, data, totalCount } = await fetchAllSites(modifiedSearchParams);
  return (
    <SiteTable
      data={data}
      pageCount={pageCount}
      totalCount={totalCount}
      active_count={active_count}
    />
  );
}
