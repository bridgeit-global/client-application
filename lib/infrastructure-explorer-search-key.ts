import type { SearchParamsProps } from '@/types';

/** Same defaults as `app/portal/site/page.tsx` for `modifiedSearchParams`. */
export function mergeSiteExplorerDefaults(
  sp: SearchParamsProps
): SearchParamsProps {
  return {
    ...sp,
    status: sp.status ?? '1',
    page: sp.page ?? '1',
    limit: sp.limit ?? '10'
  };
}

/** Stable string so the client can tell when RSC data matches the target URL. */
export function canonicalInfrastructureSearchKey(
  sp: SearchParamsProps
): string {
  const m = mergeSiteExplorerDefaults(sp);
  return Object.keys(m)
    .filter((k) => m[k] !== undefined && m[k] !== '')
    .sort()
    .map((k) => `${k}=${m[k]}`)
    .join('&');
}

export function searchParamsPropsFromURL(
  params: URLSearchParams
): SearchParamsProps {
  const o: SearchParamsProps = {};
  params.forEach((v, k) => {
    o[k] = v;
  });
  return o;
}
