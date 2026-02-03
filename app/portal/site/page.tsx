import { Card, CardContent } from '@/components/ui/card';
import { Building2, Wallet, CreditCard, Receipt, Activity } from 'lucide-react';
import { PAY_TYPE } from '@/constants/bill';
import { createClient } from '@/lib/supabase/server';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import UnifiedMap from '@/components/maps/unified-map';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils/number-format';
import { camelCaseToTitleCase } from '@/lib/utils/string-format';
import { useSiteName } from '@/lib/utils/site';
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
        {error.message || 'An unexpected error occurred while loading the data. Please try again later.'}
      </AlertDescription>
    </Alert>
  );
}

async function SiteOverview() {
  const supabase = await createClient();
  const { site_name } = await fetchOrganization();

  try {
    const [
      { data: site_type_summary, error: site_type_error },
      { data: payment_type, error: payment_error },
      { data: raw_site_type_map, error: site_map_error },
      { data: raw_paytype_map, error: paytype_map_error },
      { data: zoneData, error: zone_error },
      { data: billerBoardWiseData, error: biller_board_wise_error }
    ] = await Promise.all([
      supabase.rpc('get_site_type_summary'),
      supabase.rpc('get_connection_paytype_summary'),
      supabase.from('sites').select('id,type,zone_id,latitude,longitude').eq('is_active', true),
      supabase
        .from('connections')
        .select(`
          paytype,
          account_number,
          site_id,
          sites(
            id,
            latitude,
            longitude
          )
        `)
        .not('paytype', 'is', null).eq('is_active', true),
      supabase.rpc('get_zone_site_summary'),
      supabase.rpc('get_active_connections_by_board')
    ]);

    // Check for any Supabase errors
    const errors = [
      { error: site_type_error, name: `${site_name} Type Summary` },
      { error: payment_error, name: 'Payment Type Summary' },
      { error: site_map_error, name: `${site_name} Map Data` },
      { error: paytype_map_error, name: 'Payment Type Map Data' },
      { error: zone_error, name: 'Zone Data' },
      { error: biller_board_wise_error, name: 'Biller Board Wise Data' }
    ];

    const firstError = errors.find(e => e.error);
    if (firstError?.error) {
      throw new Error(`Failed to fetch ${firstError.name}: ${firstError.error.message}`);
    }

    // Check for missing data
    if (!site_type_summary || !payment_type || !raw_site_type_map || !raw_paytype_map || !zoneData || !billerBoardWiseData) {
      throw new Error('Some required data is missing. Please try again later.');
    }

    const site_type_map = (raw_site_type_map as StationMapItem[]).map((item) => ({
      id: item.id,
      site_type: item.type,
      zone_id: item.zone_id,
      latitude: item.latitude,
      longitude: item.longitude
    }));

    const paytype_map = (raw_paytype_map as unknown as PaymentMapItem[]).map((item) => ({
      account_number: item.account_number,
      site_id: item.site_id,
      paytype: item.paytype,
      latitude: item.sites?.[0]?.latitude || 0,
      longitude: item.sites?.[0]?.longitude || 0
    }));


    const totalActiveStation = site_type_summary.reduce((acc: number, curr: SummaryType) => acc + (curr.active_count || 0), 0);
    const totalInactiveStation = site_type_summary.reduce((acc: number, curr: SummaryType) => acc + (curr.inactive_count || 0), 0);
    const totalTotalStation = site_type_summary.reduce((acc: number, curr: SummaryType) => acc + (curr.total_count || 0), 0);

    const totalConnections = payment_type.reduce((acc: number, curr: SummaryType) => acc + (curr.total_count || 0), 0);
    const totalActiveConnections = payment_type.reduce((acc: number, curr: SummaryType) => acc + (curr.active_count || 0), 0);
    const totalInactiveConnections = payment_type.reduce((acc: number, curr: SummaryType) => acc + (curr.inactive_count || 0), 0);

    return (
      <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active {site_name}</p>
                    <h2 className="text-2xl font-bold text-gray-900">{formatNumber(totalActiveStation)}</h2>
                  </div>
                </div>
                <div className="w-full sm:w-auto text-left sm:text-right">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>{formatNumber(totalTotalStation)} Total</span>
                    </div>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span>{formatNumber(totalInactiveStation)} Inactive</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Connections</p>
                    <h2 className="text-2xl font-bold text-gray-900">{formatNumber(totalActiveConnections)}</h2>
                  </div>
                </div>
                <div className="w-full sm:w-auto text-left sm:text-right">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>{formatNumber(totalConnections)} Total</span>
                    </div>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
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
          title={`${site_name}  Types Distribution`}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{site_name} Types</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {site_type_summary.map((station: SummaryType) => {
              const totalStations = site_type_summary.reduce((acc: number, curr: SummaryType) => acc + (curr.total_count || 0), 0);
              const percentage = totalStations > 0 ? ((station.total_count / totalStations) * 100).toFixed(1) : '0.0';
              return (
                <Card key={station.type} className="bg-white hover:bg-yellow-50">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                      <h3 className="text-base font-medium text-gray-900">{station.type} {site_name}</h3>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                        {percentage}%
                      </span>
                    </div>
                    <div className="space-y-4">
                      <Link href={`/portal/site/sites?type=${station.type}`} className="block p-2 bg-gray-50 rounded-lg hover:bg-yellow-100">
                        <p className="text-2xl font-bold text-gray-900">{formatNumber(station.active_count)}</p>
                        <p className="text-sm text-gray-500">Active {site_name}</p>
                      </Link>
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Link href={`/portal/site/sites?type=${station.type}`} className="block p-2 bg-gray-50 rounded-lg hover:bg-yellow-100">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="font-medium">{formatNumber(station.total_count)}</span>
                              <span className="text-xs text-gray-500">Total</span>
                            </div>
                          </Link>
                          <Link href={`/portal/site/sites?type=${station.type}&status=0`} className="block p-2 bg-gray-50 rounded-lg hover:bg-yellow-100">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              <span className="font-medium">{formatNumber(station.inactive_count)}</span>
                              <span className="text-xs text-gray-500">Inactive</span>
                            </div>
                          </Link>
                        </div>
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
            <div className="p-2 bg-purple-50 rounded-lg">
              <Wallet className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Payment Types</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {payment_type.map((payment: SummaryType) => {
              const percentage = totalConnections > 0 ? ((payment.total_count / totalConnections) * 100).toFixed(1) : '0.0';
              return (
                <Card key={payment.paytype} className="bg-white hover:bg-yellow-50">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-50 rounded-lg">
                          {payment.paytype === 1 ? (
                            <CreditCard className="h-5 w-5 text-purple-600" />
                          ) : payment.paytype === 0 ? (
                            <Wallet className="h-5 w-5 text-purple-600" />
                          ) : (
                            <Receipt className="h-5 w-5 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-gray-900">
                            {camelCaseToTitleCase(PAY_TYPE[payment.paytype || 0])}
                          </h3>
                          <p className="text-xs text-gray-500">Connections</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-purple-50 text-purple-600 rounded-full">
                        {percentage}%
                      </span>
                    </div>
                    <div className="space-y-4">
                      <Link href={`/portal/site/${PAY_TYPE[payment.paytype || 0]}?status=1`} className="block p-2 bg-gray-50 rounded-lg hover:bg-yellow-100">
                        <p className="text-2xl font-bold text-gray-900">{formatNumber(payment.active_count)}</p>
                        <p className="text-sm text-gray-500">Active Connections</p>
                      </Link>
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Link href={`/portal/site/${PAY_TYPE[payment.paytype || 0]}`} className="block p-2 bg-gray-50 rounded-lg hover:bg-yellow-100">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="font-medium">{formatNumber(payment.total_count)}</span>
                              <span className="text-xs text-gray-500">Total</span>
                            </div>
                          </Link>
                          <Link href={`/portal/site/${PAY_TYPE[payment.paytype || 0]}?status=0`} className="block p-2 bg-gray-50 rounded-lg hover:bg-yellow-100">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              <span className="font-medium">{formatNumber(payment.inactive_count)}</span>
                              <span className="text-xs text-gray-500">Inactive</span>
                            </div>
                          </Link>
                        </div>
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
    return (
      <ErrorDisplay error={error as Error} />
    );
  }
}

export default async function Page() {
  return (
    <Suspense fallback={<div className="p-4 space-y-4">
      <Skeleton className="h-[500px] w-full" />
      <Skeleton className="h-[400px] w-full" />
      <Skeleton className="h-[300px] w-full" />
    </div>}>
      <div className="p-4">
        <SiteOverview />
      </div>
    </Suspense>
  );
}
