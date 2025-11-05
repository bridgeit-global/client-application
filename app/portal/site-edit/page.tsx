import { EditSiteForm } from '@/components/forms/client-form/edit-site-form';
import { SiteForm } from '@/components/forms/client-form/site-form';
import { fetchSiteDetails } from '@/services/sites';
import { SearchParamsProps } from '@/types';
export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
  if (!searchParams.id) {
    return <SiteForm />
  }
  const { data } = await fetchSiteDetails(searchParams);
  return (
    <EditSiteForm initialData={data} />
  );
}
