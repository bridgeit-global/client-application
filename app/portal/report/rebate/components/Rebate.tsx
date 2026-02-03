'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon, ReloadIcon, FileIcon, CircleIcon, LightningBoltIcon, HomeIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import FilterChips from '@/components/filter-chip';
import { useRouter } from 'next/navigation';
import { formatNumber } from '@/lib/utils/number-format';
import FilterAction from '../../components/filter-action';

interface MonthlyLPSCData {
  month: string;
  rebate_potential: number;
  rebate_accrued: number;
  potential_count: number;
  accrued_count: number;
  connection_count: number;
  station_count: number;
  bills: number;
}

interface FilterBody {
  site_id?: string;
  zone_id?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  due_date_start?: string;
  due_date_end?: string;
  period?: string;
  account_number?: string;
  biller_id?: string;
}

const formatDateString = (date: Date) => {

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthName = (date: string) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = parseInt(date.split('-')[1]) - 1;
  return `${monthNames[monthIndex]} ${date.split('-')[0]}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length > 0) {
    const item = payload[0].payload;
    return (
      <Card className="bg-background border shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {item.month}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <LightningBoltIcon className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Potential Rebate</p>
                <p className="text-sm font-medium">₹{formatNumber(item.rebate_potential)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HomeIcon className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Accrued Rebate</p>
                <p className="text-sm font-medium">₹{formatNumber(item.rebate_accrued)}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <FileIcon className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Potential Bills</p>
                <p className="text-sm font-medium">{formatNumber(item.potential_count)} bills</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileIcon className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Accrued Bills</p>
                <p className="text-sm font-medium">{formatNumber(item.accrued_count)} bills</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <FileIcon className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Bills</p>
                <p className="text-sm font-medium">{formatNumber(item.bills)} bills</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CircleIcon className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Connections</p>
                <p className="text-sm font-medium">{formatNumber(item.connection_count)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HomeIcon className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground"></p>
                <p className="text-sm font-medium">{formatNumber(item.station_count)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  return null;
};

export default function Rebate({ site_type }: { site_type: string }) {
  const [monthlyData, setMonthlyData] = useState<MonthlyLPSCData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterBody, setFilterBody] = useState<FilterBody>({
    period: '3',
    type: site_type
  });
  const router = useRouter();
  const supabase = createClient();


  // Second effect to fetch delay data when filterBody changes
  useEffect(() => {
    fetchRebateData();
  }, [filterBody]);

  const fetchRebateData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('bills')
        .select(`
          id,
          connection_id,
          rebate_potential,
          rebate_accrued,
          bill_date,
          due_date,
          site_type,
          connections!inner(
            id,
            account_number,
            biller_list!inner(
              alias
            ),
            site_id,
            sites!inner(
              id,
              zone_id,
              type
            )
          )
        `)
        .eq('is_valid', true)
        .eq('is_deleted', false)

      // Apply date filters
      if (filterBody.period === 'custom' && filterBody.start_date && filterBody.end_date) {
        query = query
          .gte('bill_date', filterBody.start_date)
          .lte('bill_date', filterBody.end_date);
      } else {
        const today = new Date();
        const months = parseInt(filterBody.period || '3');
        const startDate = new Date(today.getFullYear(), today.getMonth() - months, 1);
        const endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        query = query
          .gte('bill_date', formatDateString(startDate))
          .lte('bill_date', formatDateString(endDate));
      }

      // Apply other filters
      if (filterBody.account_number) {
        query = query.eq('connections.account_number', filterBody.account_number);
      }
      if (filterBody.site_id) {
        query = query.eq('connections.site_id', filterBody.site_id);
      }
      if (filterBody.zone_id) {
        query = query.eq('connections.sites.zone_id', filterBody.zone_id);
      }
      if (filterBody.type) {
        query = query.in('site_type', filterBody.type.split(','));
      }
      if (filterBody.biller_id) {
        query = query.in('connections.biller_list.alias', filterBody.biller_id.split(','));
      }

      if (filterBody.due_date_start && filterBody.due_date_end) {
        query = query
          .gte('due_date', filterBody.due_date_start)
          .lte('due_date', filterBody.due_date_end);
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Process data to calculate monthly rebate distribution
      const monthlyRebate: {
        [key: string]: {
          bills: number;
          rebate_potential: number;
          rebate_accrued: number;
          potential_count: number;
          accrued_count: number;
          connections: Set<string>;
          stations: Set<string>;
        }
      } = {};

      data.forEach((bill: any) => {
        const monthYear = bill.bill_date.substring(0, 7); // Get YYYY-MM
        const rebatePotential = bill.rebate_potential || 0;
        const rebateAccrued = bill.rebate_accrued || 0;
        const connectionId = bill.connections.id;
        const stationId = bill.connections.site_id;

        if (!monthlyRebate[monthYear]) {
          monthlyRebate[monthYear] = {
            bills: 0,
            rebate_potential: 0,
            rebate_accrued: 0,
            potential_count: 0,
            accrued_count: 0,
            connections: new Set(),
            stations: new Set()
          };
        }

        if (rebatePotential > 0) {
          monthlyRebate[monthYear].rebate_potential += rebatePotential;
          monthlyRebate[monthYear].potential_count += 1;
        }

        if (rebateAccrued > 0) {
          monthlyRebate[monthYear].rebate_accrued += rebateAccrued;
          monthlyRebate[monthYear].accrued_count += 1;
        }

        monthlyRebate[monthYear].bills += 1;
        monthlyRebate[monthYear].connections.add(connectionId);
        monthlyRebate[monthYear].stations.add(stationId);
      });

      // Convert to array and sort by date
      const chartData = Object.entries(monthlyRebate)
        .map(([month, data]) => ({
          originalMonth: month, // Keep the original YYYY-MM format for sorting
          month: getMonthName(month),
          bills: data.bills,
          rebate_potential: data.rebate_potential,
          rebate_accrued: data.rebate_accrued,
          potential_count: data.potential_count,
          accrued_count: data.accrued_count,
          connection_count: data.connections.size,
          station_count: data.stations.size
        }))
        .sort((a, b) => a.originalMonth.localeCompare(b.originalMonth))
        .map(data => ({
          month: data.month,
          bills: data.bills,
          rebate_potential: data.rebate_potential,
          rebate_accrued: data.rebate_accrued,
          potential_count: data.potential_count,
          accrued_count: data.accrued_count,
          connection_count: data.connection_count,
          station_count: data.station_count
        }));

      setMonthlyData(chartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchRebateData();
  };

  const handleClearFilter = () => {
    setFilterBody({ period: '1' });
    fetchRebateData();
  };

  const handleBarClick = (data: any) => {
    if (!data || !data.activePayload || !data.activePayload[0]) return;

    const monthData = data.activePayload[0].payload;
    const queryParams = new URLSearchParams();

    // Add existing filters
    if (filterBody.site_id) queryParams.append('site_id', filterBody.site_id);
    if (filterBody.zone_id) queryParams.append('zone_id', filterBody.zone_id);
    queryParams.append('type', filterBody.type || '');
    if (filterBody.account_number) queryParams.append('account_number', filterBody.account_number);
    if (filterBody.biller_id) queryParams.append('biller_id', filterBody.biller_id);
    if (filterBody.due_date_start) queryParams.append('due_date_start', filterBody.due_date_start);
    if (filterBody.due_date_end) queryParams.append('due_date_end', filterBody.due_date_end);
    queryParams.append('is_rebate_eligible', 'true');

    // Get the month and year from the clicked bar
    const [monthName, year] = monthData.month.split(' ');
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName) + 1;
    const monthStr = String(monthIndex).padStart(2, '0');

    // Set date range for the selected month
    const startDate = `${year}-${monthStr}-01`;
    const endDate = `${year}-${monthStr}-${new Date(parseInt(year), monthIndex, 0).getDate()}`;

    queryParams.append('bill_date_start', startDate);
    queryParams.append('bill_date_end', endDate);

    // Navigate to the report page with filters
    router.push(`/portal/report/bill?${queryParams.toString()}`);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <FilterAction
            filterBody={filterBody}
            setFilterBody={setFilterBody}
            handleApplyFilters={handleApplyFilters}
            handleClearFilter={handleClearFilter}
          />
        </div>

        <div className="transition-all duration-200">
          <FilterChips
            filterBody={filterBody}
            setFilterBody={setFilterBody}
            fetchData={handleApplyFilters}
          />
        </div>
      </div>

      <Card className="overflow-hidden border-2 bg-card transition-all duration-200 hover:border-primary/20">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold">Monthly Rebate Distribution</CardTitle>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ReloadIcon className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Monthly distribution of potential and accrued rebate amounts
          </p>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <AlertDescription className="flex items-center gap-4">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchRebateData}
                  className="ml-auto"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full rounded-lg" />
              <div className="flex justify-center">
                <span className="text-sm text-muted-foreground">Loading monthly rebate data...</span>
              </div>
            </div>
          ) : monthlyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center">
              <div className="rounded-full bg-muted p-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-medium">No rebate data available</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Try adjusting your filters or selecting a different date range to view monthly rebate distribution
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilter}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="h-[400px] mt-6 transition-all duration-200">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                  onClick={handleBarClick}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatNumber(value)} />
                  <Tooltip
                    content={<CustomTooltip />}
                  />
                  <Legend />
                  <Bar
                    className="cursor-pointer hover:opacity-80"
                    dataKey="rebate_potential"
                    name="Total Rebate"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 