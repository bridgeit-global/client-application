import { BillReportTable } from '@/components/tables/report/bill-report-table';
import { fetchBillHistoryReport } from '@/services/reports';
import { SearchParamsProps } from '@/types';

export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
  const { pageCount, data, totalCount } = await fetchBillHistoryReport(searchParams);
  return (
    <div id="bill-report">
      <BillReportTable
        data={data}
        pageCount={pageCount}
        totalCount={totalCount}
      />
    </div>
  );
}
