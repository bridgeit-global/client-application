import ConnectionForm from '@/components/forms/client-form/connection-form';
import { SearchParamsProps } from '@/types';
export default async function Page({
    params,
}: {
    params: SearchParamsProps;
}) {
    return <ConnectionForm paytype={'1'} site_id={params.id} />
}
