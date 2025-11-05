import { PaymentReportTable } from '@/components/tables/report/payment-report-table';
import { fetchPaymentHistoryReport } from '@/services/reports';
import { SearchParamsProps } from '@/types';
export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
  const { pageCount, data, totalCount } =
    await fetchPaymentHistoryReport(searchParams);
  return (
    <div id="bill-report">
      <PaymentReportTable
        data={data}
        pageCount={pageCount}
        totalCount={totalCount}
      />
    </div>
  );
}
