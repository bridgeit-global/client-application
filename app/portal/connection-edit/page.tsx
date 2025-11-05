import ConnectionForm from '@/components/forms/client-form/connection-form';
import EditConnectionForm from '@/components/forms/client-form/edit-connection-form';
import { fetchConnectionDetails } from '@/services/connections';
import { SearchParamsProps } from '@/types';

export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {

  if (!searchParams.id) {
    return <ConnectionForm paytype={searchParams.paytype} site_id={searchParams.site_id} />
  }

  const { data } = await fetchConnectionDetails(searchParams);

  return (
    <EditConnectionForm
      connectionId={searchParams.id}
      initialData={{
        biller_id: data.biller_id || '',
        site_id: data.site_id || '',
        paytype: data.paytype || '',
        parameters: data.parameters || []
      }}
    />
  );
}
