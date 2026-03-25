import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PortalPageHeader } from '@/components/portal/PortalPageHeader';
import { SiteNetworkOverview } from '@/components/portal/site-network-overview';
import { InfrastructureExplorer } from '@/components/portal/infrastructure-explorer';
import { fetchAllSites } from '@/services/sites';
import { fetchOrganization } from '@/services/organization';
import type { SearchParamsProps } from '@/types';
import { canonicalInfrastructureSearchKey } from '@/lib/infrastructure-explorer-search-key';

function OverviewSkeleton() {
  return (
    <div className="space-y-4 p-2">
      <Skeleton className="h-40 w-full rounded-md" />
      <Skeleton className="h-64 w-full rounded-md" />
      <Skeleton className="h-48 w-full rounded-md" />
    </div>
  );
}

export default async function Page(props: {
  searchParams: Promise<SearchParamsProps>;
}) {
  const searchParams = await props.searchParams;
  const { site_name } = await fetchOrganization();

  const modifiedSearchParams: SearchParamsProps = {
    ...searchParams,
    status: searchParams.status ?? '1',
    page: searchParams.page ?? '1',
    limit: searchParams.limit ?? '10'
  };

  const { data: sites, pageCount, totalCount } =
    await fetchAllSites(modifiedSearchParams);

  const currentPage = Number(modifiedSearchParams.page ?? 1) || 1;
  const pageSize = Number(modifiedSearchParams.limit ?? 10) || 10;

  const paytypeRaw = searchParams.paytype;
  const paytypeFilter =
    paytypeRaw !== undefined && paytypeRaw !== ''
      ? Number(paytypeRaw)
      : undefined;
  const paytypeValid =
    paytypeFilter !== undefined && !Number.isNaN(paytypeFilter)
      ? paytypeFilter
      : undefined;

  const resolvedSearchKey =
    canonicalInfrastructureSearchKey(modifiedSearchParams);

  return (
    <div className="space-y-8 px-4 py-6 pb-10">
      <PortalPageHeader
        title="Infrastructure"
        description={`${site_name}s, connections, and network overview in one place.`}
      />

      <details className="rounded-lg border border-border bg-card">
        <summary className="cursor-pointer list-none px-4 py-3 text-lg font-semibold text-foreground md:text-xl [&::-webkit-details-marker]:hidden">
          <span className="text-primary">▸</span>{' '}
          <span className="ml-1">Network overview</span>
        </summary>
        <div className="border-t border-border px-2 pb-4 pt-2 md:px-4">
          <Suspense fallback={<OverviewSkeleton />}>
            <SiteNetworkOverview />
          </Suspense>
        </div>
      </details>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
          {site_name} explorer
        </h2>
        <InfrastructureExplorer
          sites={sites}
          pageCount={pageCount}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          siteLabel={site_name}
          paytypeFilter={paytypeValid}
          resolvedSearchKey={resolvedSearchKey}
        />
      </section>
    </div>
  );
}
