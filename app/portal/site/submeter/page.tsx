import { ConnectionTable } from '@/components/tables/connection/connection-table';
import { Separator } from '@/components/ui/separator';
import { getActiveConnectionsByPaytype } from '@/services/dashboard';
import { fetchAllConnections } from '@/services/sites';
import { SearchParamsProps } from '@/types';
export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  const payType = 'submeter';
  const { count: active_count } = await getActiveConnectionsByPaytype({ paytype: -1 });
  const { pageCount, data, totalCount } = await fetchAllConnections(
    searchParams,
    { pay_type: -1 }
  );
  return (
    <div id={payType}>
      <ConnectionTable
        payType={payType}
        data={data}
        pageCount={pageCount}
        totalCount={totalCount}
        active_count={active_count}
      />
    </div>
  );
}
