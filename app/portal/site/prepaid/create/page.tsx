import ConnectionForm from '@/components/forms/client-form/connection-form';
import type { SearchParamsProps } from '@/types';

export default async function Page(props: {
  searchParams: Promise<SearchParamsProps>;
}) {
  const searchParams = await props.searchParams;
  return (
    <ConnectionForm paytype="0" site_id={searchParams.site_id} />
  );
}
