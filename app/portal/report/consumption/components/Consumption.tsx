'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon, ReloadIcon, FileIcon, CircleIcon, HomeIcon, LightningBoltIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import FilterChips from '@/components/filter-chip';
import { useRouter } from 'next/navigation';
import { formatNumber } from '@/lib/utils/number-format';
import FilterAction from '../../components/filter-action';
import { useSiteName } from '@/lib/utils/site';
interface ConsumptionData {
    month: string;
    consumption: number;
    connectionCount: number;
    siteCount: number;
    billCount: number;
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

const formatMonthYear = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const site_name = useSiteName();
    const data = payload[0].payload;
    return (
        <Card className="bg-background border shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <LightningBoltIcon className="h-4 w-4 text-muted-foreground" />
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <LightningBoltIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Consumption</p>
                            <p className="text-sm font-medium">{formatNumber(data.consumption)} Units</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Bills</p>
                            <p className="text-sm font-medium">{formatNumber(data.billCount)}</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <CircleIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Connections</p>
                            <p className="text-sm font-medium">{formatNumber(data.connectionCount)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <HomeIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{site_name}s</p>
                            <p className="text-sm font-medium">{formatNumber(data.siteCount)}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default function Consumption({ site_type }: { site_type: string }) {
    const [consumptionData, setConsumptionData] = useState<ConsumptionData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterBody, setFilterBody] = useState<FilterBody>({
        period: '3',
        type: site_type
    });
    const supabase = createClient();
    const router = useRouter();

    // Effect to update filterBody when user data is available


    // Effect to fetch data when filterBody.type is set
    useEffect(() => {
        fetchConsumptionData();
    }, [filterBody]);

    const fetchConsumptionData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            let query = supabase
                .from('bills')
                .select(`
                    billed_unit,
                    bill_date,
                    connection_id,
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
                const types = filterBody.type.split(',');
                query = query.in('connections.sites.type', types);
            }

            if (filterBody.biller_id) {
                query = query.in('connections.biller_list.alias', filterBody.biller_id.split(','));
            }

            if (filterBody.due_date_start && filterBody.due_date_end) {
                query = query
                    .gte('due_date', filterBody.due_date_start)
                    .lte('due_date', filterBody.due_date_end);
            }

            const { data, error: supabaseError } = await query.order('bill_date', { ascending: true });

            if (supabaseError) {
                throw new Error(supabaseError.message);
            }

            // Process and aggregate data by month
            const monthlyData = data.reduce((acc: {
                [key: string]: {
                    consumption: number,
                    originalDate: string,
                    connections: Set<string>,
                    sites: Set<string>,
                    billCount: number
                }
            }, bill: any) => {
                const monthYear = formatMonthYear(bill.bill_date);
                if (!acc[monthYear]) {
                    acc[monthYear] = {
                        consumption: 0,
                        originalDate: bill.bill_date,
                        connections: new Set(),
                        sites: new Set(),
                        billCount: 0
                    };
                }
                acc[monthYear].consumption += Number(bill.billed_unit);
                acc[monthYear].connections.add(bill.connection_id);
                acc[monthYear].sites.add(bill.connections.site_id);
                acc[monthYear].billCount += 1;
                return acc;
            }, {});

            const chartData = Object.entries(monthlyData)
                .sort(([, a], [, b]) => new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime())
                .map(([month, data]) => ({
                    month,
                    consumption: Number(data.consumption.toFixed(2)),
                    connectionCount: data.connections.size,
                    siteCount: data.sites.size,
                    billCount: data.billCount
                }));

            setConsumptionData(chartData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyFilters = () => {
        fetchConsumptionData();
    };

    const handleClearFilter = () => {
        setFilterBody({ period: '1' });
        fetchConsumptionData();
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

        // Get the month and year from the clicked bar (format: "Month YYYY")
        const [monthName, year] = monthData.month.split(' ');
        const month = new Date(`${monthName} 1, ${year}`).getMonth() + 1; // JS months are 0-based

        const monthStr = String(month).padStart(2, '0');
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
                        <CardTitle className="text-2xl font-semibold">Monthly Consumption Trend</CardTitle>
                        {isLoading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ReloadIcon className="h-4 w-4 animate-spin" />
                                <span>Updating...</span>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Visualizing consumption patterns across different time periods
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
                                    onClick={fetchConsumptionData}
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
                                <span className="text-sm text-muted-foreground">Loading consumption data...</span>
                            </div>
                        </div>
                    ) : consumptionData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center">
                            <div className="rounded-full bg-muted p-4">
                                <ExclamationTriangleIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-medium">No consumption data available</p>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    Try adjusting your filters or selecting a different date range to view consumption patterns
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
                                    onClick={handleBarClick}
                                    data={consumptionData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                    className="transition-all duration-200"
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        className="opacity-30"
                                    />
                                    <XAxis
                                        dataKey="month"
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        tick={{ fill: 'currentColor', fontSize: 12 }}
                                        tickLine={{ stroke: 'currentColor' }}
                                    />
                                    <YAxis

                                        label={{
                                            value: 'Consumption (Units)',
                                            angle: -90,
                                            position: 'insideLeft',
                                            style: { textAnchor: 'middle', fill: 'currentColor', fontSize: 12 }
                                        }}
                                        tick={{ fill: 'currentColor', fontSize: 12 }}
                                        tickLine={{ stroke: 'currentColor' }}
                                        tickFormatter={(value) => formatNumber(value)}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{ fill: 'currentColor', opacity: 0.1 }}
                                    />
                                    <Legend
                                        wrapperStyle={{
                                            fontSize: '12px',
                                            marginTop: '8px'
                                        }}
                                    />
                                    <Bar
                                        dataKey="consumption"
                                        fill="hsl(var(--primary))"
                                        name="Consumption (Units)"
                                        radius={[4, 4, 0, 0]}
                                        className="transition-all duration-200 hover:opacity-80 cursor-pointer"
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
