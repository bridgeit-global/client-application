import { PrepaidBalanceLagTable } from '@/components/tables/connection/prepaid-balance-lag-table';
import { fetchPrepaidBalanceLag } from '@/services/sites';
import { SearchParamsProps } from '@/types';
// Request-scoped page; also avoids the useSearchParams prerender bailout.
export const dynamic = 'force-dynamic';

export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
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
