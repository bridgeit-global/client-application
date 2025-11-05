import { RechargeReportTable } from '@/components/tables/report/recharge-report-table';
import { fetchRechargeReport } from '@/services/reports';
import { SearchParamsProps } from '@/types';
export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
  const { pageCount, data, totalCount } = await fetchRechargeReport(searchParams);
  return (
    <div id="recharge-report">
      <RechargeReportTable
        data={data}
        pageCount={pageCount}
        totalCount={totalCount}
      />
    </div>
  );
}
