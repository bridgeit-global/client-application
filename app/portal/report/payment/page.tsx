import { PaymentReportTable } from '@/components/tables/report/payment-report-table';
import { fetchPaymentHistoryReport } from '@/services/reports';
import { SearchParamsProps } from '@/types';
// Request-scoped page; also avoids the useSearchParams prerender bailout.
export const dynamic = 'force-dynamic';

export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
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
