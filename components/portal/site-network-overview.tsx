import { Card, CardContent } from '@/components/ui/card';
import { Building2, Wallet, CreditCard, Receipt, Activity } from 'lucide-react';
import { PAY_TYPE } from '@/constants/bill';
import { createClient } from '@/lib/supabase/server';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import UnifiedMap from '@/components/maps/unified-map';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils/number-format';
import { camelCaseToTitleCase } from '@/lib/utils/string-format';
import { fetchOrganization } from '@/services/organization';
import BillerStatsTable from '@/components/dashboard/biller-stats-table';

interface SummaryType {
  active_count: number;
  inactive_count: number;
  total_count: number;
  type?: string;
  paytype?: number;
  connection_type?: string | null;
}

interface StationMapItem {
  id: string;
  type: string;
  zone_id: string;
  latitude: number;
  longitude: number;
}

interface PaymentMapItem {
  account_number: string;
  site_id: string;
  paytype: number;
  sites: {
    id: string;
    latitude: number;
    longitude: number;
  }[];
}

function ErrorDisplay({ error }: { error: Error }) {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message ||
          'An unexpected error occurred while loading the data. Please try again later.'}
      </AlertDescription>
    </Alert>
  );
}

/** Collapsible “Network overview” body: maps, distribution, biller stats. Uses portal theme tokens. */
export async function SiteNetworkOverview() {
  const supabase = await createClient();
  const { site_name } = await fetchOrganization();

  try {
    const [
      { data: site_type_summary, error: site_type_error },
      { data: payment_type, error: payment_error },
      { data: raw_site_type_map, error: site_map_error },
      { data: raw_paytype_map, error: paytype_map_error },
      { error: zone_error },
      { data: billerBoardWiseData, error: biller_board_wise_error }
    ] = await Promise.all([
      supabase.rpc('get_site_type_summary'),
      supabase.rpc('get_connection_paytype_summary'),
      supabase.from('sites').select('id,type,zone_id,latitude,longitude').eq('is_active', true),
      supabase
        .from('connections')
        .select(
          `
          paytype,
          account_number,
          site_id,
          sites(
            id,
            latitude,
            longitude
          )
        `
        )
        .not('paytype', 'is', null)
        .eq('is_active', true),
      supabase.rpc('get_zone_site_summary'),
      supabase.rpc('get_active_connections_by_board')
    ]);

    const errors = [
      { error: site_type_error, name: `${site_name} Type Summary` },
      { error: payment_error, name: 'Payment Type Summary' },
      { error: site_map_error, name: `${site_name} Map Data` },
      { error: paytype_map_error, name: 'Payment Type Map Data' },
      { error: zone_error, name: 'Zone Data' },
      { error: biller_board_wise_error, name: 'Biller Board Wise Data' }
    ];

    const firstError = errors.find((e) => e.error);
    if (firstError?.error) {
      throw new Error(
        `Failed to fetch ${firstError.name}: ${firstError.error.message}`
      );
    }

    if (
      !site_type_summary ||
      !payment_type ||
      !raw_site_type_map ||
      !raw_paytype_map ||
      !billerBoardWiseData
    ) {
      throw new Error('Some required data is missing. Please try again later.');
    }

    const site_type_map = (raw_site_type_map as StationMapItem[]).map((item) => ({
      id: item.id,
      site_type: item.type,
      zone_id: item.zone_id,
      latitude: item.latitude,
      longitude: item.longitude
    }));

    const paytype_map = (raw_paytype_map as unknown as PaymentMapItem[]).map(
      (item) => ({
        account_number: item.account_number,
        site_id: item.site_id,
        paytype: item.paytype,
        latitude: item.sites?.[0]?.latitude || 0,
        longitude: item.sites?.[0]?.longitude || 0
      })
    );

    const totalActiveStation = site_type_summary.reduce(
      (acc: number, curr: SummaryType) => acc + (curr.active_count || 0),
      0
    );
    const totalInactiveStation = site_type_summary.reduce(
      (acc: number, curr: SummaryType) => acc + (curr.inactive_count || 0),
      0
    );
    const totalTotalStation = site_type_summary.reduce(
      (acc: number, curr: SummaryType) => acc + (curr.total_count || 0),
      0
    );

    const totalConnections = payment_type.reduce(
      (acc: number, curr: SummaryType) => acc + (curr.total_count || 0),
      0
    );
    const totalActiveConnections = payment_type.reduce(
      (acc: number, curr: SummaryType) => acc + (curr.active_count || 0),
      0
    );
    const totalInactiveConnections = payment_type.reduce(
      (acc: number, curr: SummaryType) => acc + (curr.inactive_count || 0),
      0
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Active {site_name}s
                    </p>
                    <h2 className="text-2xl font-bold text-foreground">
                      {formatNumber(totalActiveStation)}
                    </h2>
                  </div>
                </div>
                <div className="w-full text-left sm:w-auto sm:text-right">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>{formatNumber(totalTotalStation)} Total</span>
                    </div>
                    <span className="hidden sm:inline text-muted-foreground">
                      |
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span>{formatNumber(totalInactiveStation)} Inactive</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Activity className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Active Connections
                    </p>
                    <h2 className="text-2xl font-bold text-foreground">
                      {formatNumber(totalActiveConnections)}
                    </h2>
                  </div>
                </div>
                <div className="w-full text-left sm:w-auto sm:text-right">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>{formatNumber(totalConnections)} Total</span>
                    </div>
                    <span className="hidden sm:inline text-muted-foreground">
                      |
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span>{formatNumber(totalInactiveConnections)} Inactive</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <UnifiedMap
          stationsData={site_type_map}
          paymentsData={paytype_map}
          title={`${site_name} Types Distribution`}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground md:text-2xl">
              {site_name} Types
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {site_type_summary.map((station: SummaryType) => {
              const totalStations = site_type_summary.reduce(
                (acc: number, curr: SummaryType) => acc + (curr.total_count || 0),
                0
              );
              const percentage =
                totalStations > 0
                  ? ((station.total_count / totalStations) * 100).toFixed(1)
                  : '0.0';
              const typeKey = station.type ?? 'unknown';
              const withType = () => {
                const u = new URLSearchParams();
                if (station.type) u.set('type', station.type);
                return u;
              };
              const hrefActive = () => {
                const u = withType();
                u.set('status', '1');
                return `/portal/site?${u.toString()}`;
              };
              const hrefAll = () => {
                const u = withType();
                return u.toString()
                  ? `/portal/site?${u.toString()}`
                  : '/portal/site';
              };
              const hrefInactive = () => {
                const u = withType();
                u.set('status', '0');
                return `/portal/site?${u.toString()}`;
              };
              return (
                <Card
                  key={typeKey}
                  className="border-border bg-card transition-colors hover:bg-muted/40"
                >
                  <CardContent className="pt-6">
                    <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                      <h3 className="text-base font-medium text-foreground">
                        {station.type} {site_name}
                      </h3>
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {percentage}%
                      </span>
                    </div>
                    <div className="space-y-4">
                      <Link
                        href={hrefActive()}
                        className="block rounded-lg bg-muted/60 p-2 hover:bg-muted"
                      >
                        <p className="text-2xl font-bold text-foreground">
                          {formatNumber(station.active_count)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Active {site_name}s
                        </p>
                      </Link>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Link
                          href={hrefAll()}
                          className="block rounded-lg bg-muted/60 p-2 hover:bg-muted"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="font-medium text-foreground">
                              {formatNumber(station.total_count)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Total
                            </span>
                          </div>
                        </Link>
                        <Link
                          href={hrefInactive()}
                          className="block rounded-lg bg-muted/60 p-2 hover:bg-muted"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-destructive" />
                            <span className="font-medium text-foreground">
                              {formatNumber(station.inactive_count)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Inactive
                            </span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <Wallet className="h-5 w-5 text-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground md:text-2xl">
              Payment Types
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {payment_type.map((payment: SummaryType) => {
              const percentage =
                totalConnections > 0
                  ? ((payment.total_count / totalConnections) * 100).toFixed(1)
                  : '0.0';
              const payKey = payment.paytype ?? 0;
              return (
                <Card
                  key={payKey}
                  className="border-border bg-card transition-colors hover:bg-muted/40"
                >
                  <CardContent className="pt-6">
                    <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-muted p-2">
                          {payment.paytype === 1 ? (
                            <CreditCard className="h-5 w-5 text-foreground" />
                          ) : payment.paytype === 0 ? (
                            <Wallet className="h-5 w-5 text-foreground" />
                          ) : (
                            <Receipt className="h-5 w-5 text-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-foreground">
                            {camelCaseToTitleCase(PAY_TYPE[payKey])}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Connections
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {percentage}%
                      </span>
                    </div>
                    <div className="space-y-4">
                      <Link
                        href={`/portal/site?paytype=${payKey}&status=1`}
                        className="block rounded-lg bg-muted/60 p-2 hover:bg-muted"
                      >
                        <p className="text-2xl font-bold text-foreground">
                          {formatNumber(payment.active_count)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Active Connections
                        </p>
                      </Link>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Link
                          href={`/portal/site?paytype=${payKey}`}
                          className="block rounded-lg bg-muted/60 p-2 hover:bg-muted"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="font-medium text-foreground">
                              {formatNumber(payment.total_count)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Total
                            </span>
                          </div>
                        </Link>
                        <Link
                          href={`/portal/site?paytype=${payKey}&status=0`}
                          className="block rounded-lg bg-muted/60 p-2 hover:bg-muted"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-destructive" />
                            <span className="font-medium text-foreground">
                              {formatNumber(payment.inactive_count)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Inactive
                            </span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <BillerStatsTable data={billerBoardWiseData} />
        </div>
      </div>
    );
  } catch (error) {
    return <ErrorDisplay error={error as Error} />;
  }
}
