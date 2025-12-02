import { RegistrationReportTable } from '@/components/tables/report/registration-report-table';
import { fetchRegistrationReport } from '@/services/reports';
import { SearchParamsProps } from '@/types';
export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  const { pageCount, data, totalCount } =
    await fetchRegistrationReport(searchParams);
  return (
    <div id="registration-report">
      <RegistrationReportTable
        data={data}
        pageCount={pageCount}
        totalCount={totalCount}
      />
    </div>
  );
}
