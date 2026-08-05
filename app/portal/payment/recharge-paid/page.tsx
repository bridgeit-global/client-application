import { PaidTable } from '@/components/tables/payment/paid-table';
import { fetchPrepaidPaid } from '@/services/payments';
import { SearchParamsProps } from '@/types';
// Request-scoped page; also avoids the useSearchParams prerender bailout.
export const dynamic = 'force-dynamic';

export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  const { pageCount, data, totalCount } = await fetchPrepaidPaid(searchParams);
  return (
    <PaidTable
      data={data}
      pageCount={pageCount}
      totalCount={totalCount}
      payType='prepaid'
    />
  );
}
