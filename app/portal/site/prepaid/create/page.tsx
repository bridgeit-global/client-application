import ConnectionForm from '@/components/forms/client-form/connection-form';
import type { SearchParamsProps } from '@/types';

// Request-scoped page; also avoids the useSearchParams prerender bailout.
export const dynamic = 'force-dynamic';

export default async function Page(props: {
  searchParams: Promise<SearchParamsProps>;
}) {
  const searchParams = await props.searchParams;
  return (
    <ConnectionForm paytype="0" site_id={searchParams.site_id} />
  );
}
