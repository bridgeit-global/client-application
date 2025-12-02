import PostpaidBillTable from '@/components/tables/bill/postpaid-bill-table';
import { ArrearsTable } from '@/components/tables/report/arrears-table';
import PenaltiesTable from '@/components/tables/report/penalties-table';
import { fetchPostpaidAllBills } from '@/services/bills';
import { fetchArrearsReport, fetchPenaltiesReport } from '@/services/reports';
import { SearchParamsProps } from '@/types';

export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  const { data } = await fetchPostpaidAllBills(searchParams);
  const { data: arrearsData } = await fetchArrearsReport();
  const { data: penalties } = await fetchPenaltiesReport();
  return (
    <div className="space-y-2">
      <PostpaidBillTable
        data={data}
      />
      <div className="grid gap-8">
        <div id="arrear-report">
          {arrearsData && arrearsData.length > 0 && (
            <ArrearsTable data={arrearsData} />
          )}
        </div>
        <div id="penalties-report">
          {penalties && penalties.length > 0 && (
            <PenaltiesTable data={penalties} />
          )}
        </div>
      </div>
    </div>
  );
}
