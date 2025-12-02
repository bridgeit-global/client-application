import { MetricCard } from '@/components/cards/metric-card';
import { Card } from '@/components/ui/card';
import { fetchConnectionCosts } from '@/services/dashboard';
import { DashboardData } from '@/types/dashboard-type';
import MapCard from '@/components/cards/map-card';
import BillerStatsTable from '@/components/dashboard/biller-stats-table';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/server';
import FinancialYearChart from '@/components/dashboard/financial-year-chart';
import FinancialMonthChart from '@/components/dashboard/financial-month-chart';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { SearchParamsProps } from '@/types';

async function fetchDashboardData(searchParams: SearchParamsProps) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const [dashboardData, billerBoardWiseData, connectionCostsResponse] = await Promise.all([
      supabase
        .from('dashboard_summary')
        .select('*')
        .order('index', { ascending: true }).eq('org_id', user?.user_metadata?.org_id),
      supabase
        .rpc('get_active_connections_by_board'),
      fetchConnectionCosts()
    ]);

    const { data: financialYearData } = await supabase.rpc('get_yearly_billing_summary');
    const { data: last12MonthsData } = await supabase.rpc('get_bill_summary_last_12_months', {
      p_site_id: searchParams.site_id || null,
      p_biller_id: searchParams.biller_id || null,
      p_station_type: searchParams.station_type || null
    });

    if (!user) {
      throw new Error('User not authenticated');
    }

    return {
      dashboardData: dashboardData.data ?? [],
      billerBoardWiseData: billerBoardWiseData.data ?? [],
      connectionCostsResponse,
      user,
      financialYearData: financialYearData ?? [],
      last12MonthsData: last12MonthsData ?? []
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  try {
    const {
      dashboardData,
      billerBoardWiseData,
      connectionCostsResponse,
      user,
      financialYearData,
      last12MonthsData
    } = await fetchDashboardData(searchParams);

    return (
      <div className="grid gap-6">
        <h1 className="text-2xl font-bold">
          Welcome {user?.user_metadata?.first_name ?? ''} {user?.user_metadata?.last_name ?? ''}
        </h1>
        <div className="text-xs text-muted-foreground text-right">
          Updated every 1 hour
        </div>
        <Suspense fallback={<div>Loading metrics...</div>}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6 lg:grid-cols-4">
            {dashboardData?.map((item: DashboardData, index: number) => (
              <MetricCard key={`metric-${index}`} {...item} />
            ))}
          </div>
        </Suspense>

        {/* <Suspense fallback={<div>Loading financial chart...</div>}>
          <FinancialYearChart data={financialYearData} />
        </Suspense>

        <Suspense fallback={<div>Loading financial chart...</div>}>
          <FinancialMonthChart data={last12MonthsData} />
        </Suspense> */}
        <Card id="biller-board" className="space-y-6">
          <Suspense fallback={<div>Loading biller stats...</div>}>
            <BillerStatsTable data={billerBoardWiseData} />
            <Separator />
            <MapCard mapData={connectionCostsResponse} />
          </Suspense>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error in dashboard page:', error);
    notFound();
  }
}
