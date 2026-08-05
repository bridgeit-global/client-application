import PrepaidBillTable from '@/components/tables/bill/prepaid-bill-table';
import { fetchPrepaidAllBills } from '@/services/bills';
import { SearchParamsProps } from '@/types';
// Request-scoped page; also avoids the useSearchParams prerender bailout.
export const dynamic = 'force-dynamic';

export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  const { data } = await fetchPrepaidAllBills(searchParams);
  return (
    <PrepaidBillTable data={data} />
  );
}
