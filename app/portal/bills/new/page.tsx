import NewBillTable from '@/components/tables/bill/new-bill-table';
import { fetchNewBills } from '@/services/bills';
import { SearchParamsProps } from '@/types';

// Request-scoped page; also avoids the useSearchParams prerender bailout.
export const dynamic = 'force-dynamic';

export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  const { pageCount, data, totalCount } = await fetchNewBills(searchParams);
  return (
    <NewBillTable
      totalAmount={0}
      data={data}
      pageCount={pageCount}
      totalCount={totalCount}
    />
  );
}
