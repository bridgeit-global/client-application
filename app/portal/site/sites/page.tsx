import { redirect } from 'next/navigation';
import type { SearchParamsProps } from '@/types';

export default async function Page(props: {
  searchParams: Promise<SearchParamsProps>;
}) {
  const searchParams = await props.searchParams;
  const p = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v !== undefined && v !== '') p.set(k, v);
  });
  const qs = p.toString();
  redirect(qs ? `/portal/site?${qs}` : '/portal/site');
}
