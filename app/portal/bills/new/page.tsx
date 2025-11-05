import NewBillTable from '@/components/tables/bill/new-bill-table';
import { fetchNewBills } from '@/services/bills';
import { SearchParamsProps } from '@/types';

export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
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
