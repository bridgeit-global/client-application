import { SiteNotFetchTable } from '@/components/tables/site/site-not-fetch-table';
import { fetchNotFetchBills } from '@/services/sites';
import { SearchParamsProps } from '@/types';
export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
  const { pageCount, data, totalCount } = await fetchNotFetchBills(searchParams);
  return (
    <SiteNotFetchTable
      data={data}
      pageCount={pageCount}
      totalCount={totalCount}
    />
  );
}
