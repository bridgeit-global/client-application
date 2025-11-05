import PrepaidBillTable from '@/components/tables/bill/prepaid-bill-table';
import { fetchPrepaidAllBills } from '@/services/bills';
import { SearchParamsProps } from '@/types';
export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
  const { data } = await fetchPrepaidAllBills(searchParams);
  return (
    <PrepaidBillTable data={data} />
  );
}
