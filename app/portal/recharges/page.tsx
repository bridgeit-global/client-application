import PrepaidBillTable from '@/components/tables/bill/prepaid-bill-table';
import { fetchPrepaidAllBills } from '@/services/bills';
import { SearchParamsProps } from '@/types';
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
