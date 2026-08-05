import { RechargeReportTable } from '@/components/tables/report/recharge-report-table';
import { fetchRechargeReport } from '@/services/reports';
import { SearchParamsProps } from '@/types';
// Request-scoped page; also avoids the useSearchParams prerender bailout.
export const dynamic = 'force-dynamic';

export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
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
