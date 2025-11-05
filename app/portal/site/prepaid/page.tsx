import { ConnectionTable } from '@/components/tables/connection/connection-table';
import { Separator } from '@/components/ui/separator';
import { getActiveConnectionsByPaytype } from '@/services/dashboard';
import { fetchPrepaidConnections } from '@/services/sites';
import { SearchParamsProps } from '@/types';
export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
  const payType = 'prepaid';
  const { count: active_count } = await getActiveConnectionsByPaytype({ paytype: 0 });
  const { pageCount, data, totalCount } = await fetchPrepaidConnections(
    searchParams,
    { pay_type: 0 }
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
