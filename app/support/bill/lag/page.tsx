import { SiteLagTable } from '@/components/tables/site/site-lag-table';
import { fetchLagSites } from '@/services/sites';
import { SearchParamsProps } from '@/types';
// Request-scoped page; also avoids the useSearchParams prerender bailout.
export const dynamic = 'force-dynamic';

export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  const { pageCount, data, totalCount } = await fetchLagSites(searchParams);
  return (
    <SiteLagTable
      data={data}
      pageCount={pageCount}
      totalCount={totalCount}
    />
  );
}
