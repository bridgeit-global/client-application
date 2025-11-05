'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon, ReloadIcon, ClockIcon, CheckCircledIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import FilterChips from '@/components/filter-chip';
import { useRouter } from 'next/navigation';
import { formatNumber } from '@/lib/utils/number-format';
import FilterAction from '../../components/filter-action';
import { snakeToTitle } from '@/lib/utils/string-format';

interface PaymentStatusData {
    type: string;
    count: number;
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

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
        const data = payload[0].payload;
        const isOnTime = data.type === 'on_time';

        return (
            <Card className="bg-background border shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        {isOnTime ? (
                            <CheckCircledIcon className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <ClockIcon className="h-4 w-4 text-orange-500" />
                        )}
                        {snakeToTitle(data.type) + ' Payment'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Bills</p>
                                <p className="text-sm font-medium">{formatNumber(data.count)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Percentage</p>
                                <p className="text-sm font-medium">{((data.count / data.total) * 100).toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Connections</p>
                                <p className="text-sm font-medium">{formatNumber(data.connections_count)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Sites</p>
                                <p className="text-sm font-medium">{formatNumber(data.sites_count)}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }
    return null;
};

export default function PaymentOnTime({ station_type }: { station_type: string }) {
    const router = useRouter();
    const [paymentStatusData, setPaymentStatusData] = useState<PaymentStatusData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterBody, setFilterBody] = useState<FilterBody>({
        period: '3',
        type: station_type
    });
    const supabase = createClient();
    const [totalBills, setTotalBills] = useState(0);

    // Effect to update filterBody when user data is available


    // Second effect to fetch delay data when filterBody changes
    useEffect(() => {
        fetchPaymentStatusData();
    }, [filterBody]);

    const fetchPaymentStatusData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            let query = supabase
                .from('bills')
                .select(
                    `bill_date,station_type,paid_status,connections!inner(*,sites!inner(zone_id,type),biller_list!inner(*))`,
                    {
                        count: 'estimated'
                    }
                )
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



            // Process data to calculate payment status distribution
            const paymentStatusCounts = {
                'on_time': 0,
                'late': 0,
            };

            type PaymentStatus = keyof typeof paymentStatusCounts;

            // Track unique connections and sites
            const connectionsByStatus = {
                'on_time': new Set<string>(),
                'late': new Set<string>(),
            };
            const sitesByStatus = {
                'on_time': new Set<string>(),
                'late': new Set<string>(),
            };

            data.forEach((bill: any) => {
                const status = bill?.paid_status as PaymentStatus;
                if (paymentStatusCounts.hasOwnProperty(status)) {
                    paymentStatusCounts[status]++;
                    // Track unique connections and sites
                    connectionsByStatus[status].add(bill?.connections?.account_number);
                    sitesByStatus[status].add(bill?.connections?.site_id);
                }
            });

            const total = Object.values(paymentStatusCounts).reduce((a: number, b: number) => a + b, 0);
            const chartData = Object.entries(paymentStatusCounts).map(([status, count]) => ({
                type: status,
                count,
                total,
                connections_count: connectionsByStatus[status as PaymentStatus].size,
                sites_count: sitesByStatus[status as PaymentStatus].size
            }));

            setPaymentStatusData(chartData);
            setTotalBills(data.length);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyFilters = () => {
        fetchPaymentStatusData();
    };

    const handleClearFilter = () => {
        setFilterBody({ period: '1' });
        fetchPaymentStatusData();
    };

    const handleChartClick = (data: any) => {
        if (!data || !data.payload) return;

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
        queryParams.append('paid_status', data.payload.type);
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

    // Add COLORS constant for pie chart segments
    const COLORS = [
        'hsl(142, 76%, 36%)',      // Emerald Green for Paid On Time
        'hsl(31, 95%, 44%)',       // Burnt Orange for Paid Late
    ];

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
                        <CardTitle className="text-2xl font-semibold">Payment Status Distribution</CardTitle>
                        {isLoading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ReloadIcon className="h-4 w-4 animate-spin" />
                                <span>Updating...</span>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Distribution of bills based on payment status - On Time Payment or Late Payment  (Click to view detailed report)
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
                                    onClick={fetchPaymentStatusData}
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
                                <span className="text-sm text-muted-foreground">Loading payment on time data...</span>
                            </div>
                        </div>
                    ) : paymentStatusData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center">
                            <div className="rounded-full bg-muted p-4">
                                <ExclamationTriangleIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-medium">No payment on time data available</p>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    Try adjusting your filters or selecting a different date range to view payment on time distribution
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
                        <>
                            {paymentStatusData.length > 0 && (
                                <div className="mb-4 flex items-center gap-2 text-base font-medium">
                                    <span>Total Bills:</span>
                                    <span className="text-primary">{formatNumber(totalBills)}</span>
                                </div>
                            )}
                            <div className="h-[400px] mt-6 transition-all duration-200">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentStatusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${snakeToTitle(name) + ' Payment'} (${(percent * 100).toFixed(0)}%)`}
                                            outerRadius={150}
                                            fill="#8884d8"
                                            dataKey="count"
                                            nameKey="type"
                                            onClick={handleChartClick}
                                            className="cursor-pointer"
                                        >
                                            {paymentStatusData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    className="transition-all duration-200 hover:opacity-80"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={<CustomTooltip />}
                                            wrapperStyle={{
                                                outline: 'none'
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            wrapperStyle={{
                                                fontSize: '12px',
                                                marginTop: '8px'
                                            }}
                                            formatter={(value) => snakeToTitle(value) + ' Payment'}
                                            onClick={handleChartClick}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}