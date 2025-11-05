'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon, ReloadIcon, FileIcon, CircleIcon, HomeIcon, CalendarIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import FilterChips from '@/components/filter-chip';
import FilterAction from '../../components/filter-action';
import { useSiteName } from '@/lib/utils/site';

interface DelayData {
    range: string;
    count: number;
    connectionCount: number;
    siteCount: number;
}

interface DelayCategory {
    count: number;
    connections: Set<string>;
    sites: Set<string>;
}

interface DelayCategories {
    '0-3 days': DelayCategory;
    '4-7 days': DelayCategory;
    '7+ days': DelayCategory;
}

interface FilterBody {
    site_id?: string;
    zone_id?: string;
    type?: string;
    due_date_start?: string;
    due_date_end?: string;
    start_date?: string;
    end_date?: string;
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
    if (!active || !payload || !payload.length) return null;
    const site_name = useSiteName();
    const data = payload[0].payload;

    return (
        <Card className="bg-background border shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Bills</p>
                            <p className="text-sm font-medium">{data.count}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <CircleIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Connections</p>
                            <p className="text-sm font-medium">{data.connectionCount}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <HomeIcon className="h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{site_name}s</p>
                        <p className="text-sm font-medium">{data.siteCount}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default function BillDateVsFetchDate({ station_type }: { station_type: string }) {
    const router = useRouter();
    const [delayData, setDelayData] = useState<DelayData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterBody, setFilterBody] = useState<FilterBody>({
        period: '3',
        type: station_type
    });
    const supabase = createClient();

    useEffect(() => {
        fetchDelayData();
    }, [filterBody]);

    const fetchDelayData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            let query = supabase
                .from('bills')
                .select(`
                    bill_date,
                    created_at,
                    connection_id,
                    station_type,
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
                query = query.in('station_type', filterBody.type.split(','));
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

            // Process data to calculate delays
            const delays: DelayCategories = {
                '0-3 days': { count: 0, connections: new Set(), sites: new Set() },
                '4-7 days': { count: 0, connections: new Set(), sites: new Set() },
                '7+ days': { count: 0, connections: new Set(), sites: new Set() }
            };

            data.forEach((bill: any) => {
                const billDate = new Date(bill.bill_date);
                const createdAt = new Date(bill.created_at);
                const diffInDays = Math.floor((createdAt.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24));

                let category: keyof DelayCategories;
                if (diffInDays <= 3) {
                    category = '0-3 days';
                } else if (diffInDays <= 7) {
                    category = '4-7 days';
                } else {
                    category = '7+ days';
                }

                delays[category].count++;
                delays[category].connections.add(bill.connection_id);
                delays[category].sites.add(bill.connections.site_id);
            });

            const chartData = Object.entries(delays).map(([range, data]) => ({
                range,
                count: data.count,
                connectionCount: data.connections.size,
                siteCount: data.sites.size
            }));

            setDelayData(chartData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyFilters = () => {
        fetchDelayData();
    };

    const handleClearFilter = () => {
        setFilterBody({ period: '1' });
        fetchDelayData();
    };

    const handleBarClick = (data: any) => {
        // Construct the filter query
        const queryParams = new URLSearchParams();

        // Add existing filters if any
        if (filterBody.site_id) queryParams.append('site_id', filterBody.site_id);
        if (filterBody.zone_id) queryParams.append('zone_id', filterBody.zone_id);
        queryParams.append('type', filterBody.type || '');
        if (filterBody.account_number) queryParams.append('account_number', filterBody.account_number);
        if (filterBody.biller_id) queryParams.append('biller_id', filterBody.biller_id);
        if (filterBody.due_date_start) queryParams.append('due_date_start', filterBody.due_date_start);
        if (filterBody.due_date_end) queryParams.append('due_date_end', filterBody.due_date_end);
        queryParams.append('bill_date_vs_fetch_date', data?.split(' ')[0]);
        // Always include date range based on period or custom dates
        if (filterBody.period === 'custom' && filterBody.start_date && filterBody.end_date) {
            queryParams.append('bill_date_start', filterBody.start_date);
            queryParams.append('bill_date_end', filterBody.end_date);
        } else {
            const today = new Date();
            const months = parseInt(filterBody.period || '3');
            const startDate = new Date(today.getFullYear(), today.getMonth() - months, 1);
            const endDate = new Date(today.getFullYear(), today.getMonth(), 0);

            queryParams.append('bill_date_start', formatDateString(startDate));
            queryParams.append('bill_date_end', formatDateString(endDate));
        }

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
                        <CardTitle className="text-2xl font-semibold">Bill Date vs Fetch Date Delay Distribution</CardTitle>
                        {isLoading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ReloadIcon className="h-4 w-4 animate-spin" />
                                <span>Updating...</span>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Distribution of bills based on the delay between bill date and fetch date
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
                                    onClick={fetchDelayData}
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
                                <span className="text-sm text-muted-foreground">Loading delay analysis data...</span>
                            </div>
                        </div>
                    ) : delayData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center">
                            <div className="rounded-full bg-muted p-4">
                                <ExclamationTriangleIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-medium">No delay analysis data available</p>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    Try adjusting your filters or selecting a different date range to view delay patterns
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
                                    data={delayData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                    className="transition-all duration-200"
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        className="opacity-30"
                                    />
                                    <XAxis
                                        dataKey="range"
                                        angle={0}
                                        textAnchor="middle"
                                        height={60}
                                        tick={{ fill: 'currentColor', fontSize: 12 }}
                                        tickLine={{ stroke: 'currentColor' }}
                                    />
                                    <YAxis
                                        label={{
                                            value: 'Number of Bills',
                                            angle: -90,
                                            position: 'insideLeft',
                                            style: { textAnchor: 'middle', fill: 'currentColor', fontSize: 12 }
                                        }}
                                        tick={{ fill: 'currentColor', fontSize: 12 }}
                                        tickLine={{ stroke: 'currentColor' }}
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
                                        dataKey="count"
                                        fill="hsl(var(--primary))"
                                        name="Number of Bills"
                                        radius={[4, 4, 0, 0]}
                                        className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                                        onClick={(data) => handleBarClick(data.range)}
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