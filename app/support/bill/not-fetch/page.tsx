import { SiteNotFetchTable } from '@/components/tables/site/site-not-fetch-table';
import { fetchNotFetchBills } from '@/services/sites';
import { SearchParamsProps } from '@/types';
export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  const { pageCount, data, totalCount } = await fetchNotFetchBills(searchParams);
  return (
    <SiteNotFetchTable
      data={data}
      pageCount={pageCount}
      totalCount={totalCount}
    />
  );
}
