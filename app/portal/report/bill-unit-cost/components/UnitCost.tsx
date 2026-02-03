'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon, ReloadIcon, LightningBoltIcon, HomeIcon, FileIcon, CircleIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import FilterChips from '@/components/filter-chip';
import { useRouter } from 'next/navigation';
import { formatNumber, formatRupees } from '@/lib/utils/number-format';
import FilterAction from '../../components/filter-action';

interface CoreCharges {
  energy_charges: number;
  fixed_charges: number;
  demand_charges: number;
  fppac_charges: number;
  minimum_charges: number;
  surcharge: number;
}

interface RegulatoryCharges {
  electricity_duty: number;
  municipal_tax: number;
  cgst: number;
  sgst: number;
  tax_at_source: number;
}

interface UnitCostData {
  bill_date: string;
  unit_cost: number;
  bill_amount: number;
  month: string;
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length > 0) {
    const [year, monthNum] = label.split('-');
    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' });
    const data = payload[0].payload;
    return (
      <Card className="bg-background border shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {monthName} {year}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <LightningBoltIcon className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Unit Cost</p>
                <p className="text-sm font-medium">{formatRupees(data.unit_cost)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileIcon className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Bill Count</p>
                <p className="text-sm font-medium">{data.bill_count}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CircleIcon className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Connection Count</p>
                <p className="text-sm font-medium">{data.connection_count}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HomeIcon className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Site Count</p>
                <p className="text-sm font-medium">{data.site_count}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  return null;
};

const CustomChargeTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length > 0) {
    return (
      <Card className="bg-background border shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="text-sm font-medium">{formatRupees(payload[0].value)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  return null;
};

export default function UnitCost({ site_type }: { site_type: string }) {
  const router = useRouter();
  const [coreCharges, setCoreCharges] = useState<CoreCharges>({
    energy_charges: 0,
    fixed_charges: 0,
    demand_charges: 0,
    fppac_charges: 0,
    minimum_charges: 0,
    surcharge: 0
  });
  const [regulatoryCharges, setRegulatoryCharges] = useState<RegulatoryCharges>({
    electricity_duty: 0,
    municipal_tax: 0,
    cgst: 0,
    sgst: 0,
    tax_at_source: 0
  });
  const [unitCostData, setUnitCostData] = useState<UnitCostData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterBody, setFilterBody] = useState<FilterBody>({
    period: '3',
    type: site_type
  });

  const supabase = createClient();

  useEffect(() => {
    fetchChargesData();
  }, [filterBody]);

  const fetchChargesData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Original charges data query
      let query = supabase
        .from('bills')
        .select(`
          bill_date,
          billed_unit,
          bill_amount,
          bill_type,
          core_charges (
            energy_charges,
            fixed_charges,
            demand_charges,
            fppac_charges,
            minimum_charges,
            surcharge
          ),
          regulatory_charges (
            electricity_duty,
            municipal_tax,
            cgst,
            sgst,
            tax_at_source
          ),
          connections!inner(
            account_number,
            biller_list!inner(
              alias
            ),
            site_id,
            sites!inner(
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


      // Process unit cost data with monthly aggregation
      const monthlyData: {
        [key: string]: {
          core_charges: number;
          regulatory_charges: number;
          billed_unit: number;
          count: number;
          connections: Set<string>;
          sites: Set<string>;
        }
      } = {};

      data.forEach((bill: any) => {
        const date = new Date(bill.bill_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            core_charges: 0,
            regulatory_charges: 0,
            billed_unit: 0,
            count: 0,
            connections: new Set(),
            sites: new Set(),
          };
        }

        // Sum core charges for this bill
        if (bill.core_charges) {
          Object.values(bill.core_charges).forEach((val: any) => {
            monthlyData[monthKey].core_charges += Number(val) || 0;
          });
        }
        // Sum regulatory charges for this bill
        if (bill.regulatory_charges) {
          Object.values(bill.regulatory_charges).forEach((val: any) => {
            monthlyData[monthKey].regulatory_charges += Number(val) || 0;
          });
        }
        // Sum billed units for this bill
        if (bill.billed_unit) {
          monthlyData[monthKey].billed_unit += bill.bill_type === 'Normal' && Number(bill.billed_unit) > 1000 ? Number(bill.billed_unit) : 0;
        }

        monthlyData[monthKey].count += 1;

        if (bill.connections && bill.connections.account_number) {
          monthlyData[monthKey].connections.add(bill.connections.account_number);
        }
        if (bill.connections && bill.connections.site_id) {
          monthlyData[monthKey].sites.add(bill.connections.site_id);
        }
      });

      const unitCosts = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        bill_date: month,
        unit_cost: data.billed_unit > 0 ? (data.core_charges + data.regulatory_charges) / data.billed_unit : 0,
        bill_amount: 0,
        bill_count: data.count,
        connection_count: data.connections.size,
        site_count: data.sites.size,
      }));

      // Sort unitCosts by month in chronological order
      unitCosts.sort((a, b) => new Date(a.month + '-01').getTime() - new Date(b.month + '-01').getTime());

      // Process and aggregate charges data
      const aggregatedCore = {
        energy_charges: 0,
        fixed_charges: 0,
        demand_charges: 0,
        fppac_charges: 0,
        minimum_charges: 0,
        surcharge: 0
      };

      const aggregatedRegulatory = {
        electricity_duty: 0,
        municipal_tax: 0,
        cgst: 0,
        sgst: 0,
        tax_at_source: 0
      };

      data.forEach((bill: any) => {
        if (bill.core_charges) {
          Object.keys(aggregatedCore).forEach(key => {
            aggregatedCore[key as keyof CoreCharges] += Number(bill.core_charges[key]) || 0;
          });
        }
        if (bill.regulatory_charges) {
          Object.keys(aggregatedRegulatory).forEach(key => {
            aggregatedRegulatory[key as keyof RegulatoryCharges] += Number(bill.regulatory_charges[key]) || 0;
          });
        }

      });
      setUnitCostData(unitCosts);
      setCoreCharges(aggregatedCore);
      setRegulatoryCharges(aggregatedRegulatory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchChargesData();
  };

  const handleClearFilter = () => {
    setFilterBody({ period: '3' });
  };

  const coreChargesData = Object.entries(coreCharges).map(([key, value]) => ({
    name: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    amount: value
  }));

  const regulatoryChargesData = Object.entries(regulatoryCharges).map(([key, value]) => ({
    name: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    amount: value
  }));


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

    // Get the month and year from the clicked bar (format: "YYYY-MM")
    const [year, monthStr] = monthData.month.split('-');
    const month = parseInt(monthStr, 10);

    // Set date range for the selected month
    const startDate = `${year}-${monthStr}-01`;
    const endDate = `${year}-${monthStr}-${new Date(parseInt(year), month, 0).getDate()}`;

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
            <CardTitle className="text-2xl font-semibold">Monthly Unit Cost</CardTitle>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ReloadIcon className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Monthly average unit cost and total consumption
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
                  onClick={fetchChargesData}
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
                <span className="text-sm text-muted-foreground">Loading monthly unit cost data...</span>
              </div>
            </div>
          ) : unitCostData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center">
              <div className="rounded-full bg-muted p-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-medium">No unit cost data available</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Try adjusting your filters or selecting a different date range to view monthly unit cost data.
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
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={unitCostData}
                  onClick={handleBarClick}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(month) => {
                      const [year, monthNum] = month.split('-');
                      return `${new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' })} ${year}`;
                    }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Unit Cost (₹)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    tickFormatter={(value) => value.toFixed(2)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="unit_cost"
                    fill="hsl(var(--primary))"
                    name="Unit Cost"
                    className="cursor-pointer hover:opacity-80"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="overflow-hidden border-2 bg-card transition-all duration-200 hover:border-primary/20">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold">Core Charges</CardTitle>
            </div>
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
                    onClick={fetchChargesData}
                    className="ml-auto"
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[400px] w-full rounded-lg" />
              </div>
            ) : (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coreChargesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tickFormatter={(value: number) => formatNumber(value)}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      content={<CustomChargeTooltip />}
                    />
                    <Legend />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 bg-card transition-all duration-200 hover:border-primary/20">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold">Regulatory Charges</CardTitle>
            </div>
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
                    onClick={fetchChargesData}
                    className="ml-auto"
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[400px] w-full rounded-lg" />
              </div>
            ) : (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regulatoryChargesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value: string) => {
                        if (value == 'Cgst' || value == 'Sgst') {
                          return value.toUpperCase()
                        }
                        return value
                      }}
                    />
                    <YAxis
                      tickFormatter={(value: number) => formatNumber(value)}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      content={<CustomChargeTooltip />}
                    />
                    <Legend />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
