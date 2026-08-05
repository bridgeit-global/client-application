import { redirect } from 'next/navigation';
import type { SearchParamsProps } from '@/types';

// Request-scoped page; also avoids the useSearchParams prerender bailout.
export const dynamic = 'force-dynamic';

export default async function Page(props: {
  searchParams: Promise<SearchParamsProps>;
}) {
  const searchParams = await props.searchParams;
  const p = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && k !== 'paytype') p.set(k, v);
  });
  p.set('paytype', '-1');
  redirect(`/portal/site?${p.toString()}`);
}
