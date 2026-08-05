import { EditSiteForm } from '@/components/forms/client-form/edit-site-form';
import { SiteForm } from '@/components/forms/client-form/site-form';
import { fetchSiteDetails } from '@/services/sites';
import { SearchParamsProps } from '@/types';
// Request-scoped page; also avoids the useSearchParams prerender bailout.
export const dynamic = 'force-dynamic';

export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  if (!searchParams.id) {
    return <SiteForm />
  }
  const { data } = await fetchSiteDetails(searchParams);
  return (
    <EditSiteForm initialData={data} />
  );
}
