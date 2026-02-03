'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon, ReloadIcon, FileIcon, CircleIcon, HomeIcon, LightningBoltIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import FilterChips from '@/components/filter-chip';
import { useRouter } from 'next/navigation';
import FilterAction from '../../components/filter-action';
import { useSiteName } from '@/lib/utils/site';

interface SanctionLoadTypeData {
    type: string;
    count: number;
    sites: number;
    bills: number;
    label: string;
}

interface FilterBody {
    site_id?: string;
    zone_id?: string;
    type?: string;
    account_number?: string;
    biller_id?: string;
    start_date?: string;
    due_date_start?: string;
    due_date_end?: string;
    end_date?: string;
    period?: string;
}

const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const site_name = useSiteName();
    const data = payload[0].payload;
    return (
        <Card className="bg-background border shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <LightningBoltIcon className="h-4 w-4 text-muted-foreground" />
                    {data.type}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <CircleIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Connections</p>
                            <p className="text-sm font-medium">{data.count}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <HomeIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{site_name}s</p>
                            <p className="text-sm font-medium">{data.sites}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Bills</p>
                        <p className="text-sm font-medium">{data.bills}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default function SanctionLoad({ site_type }: { site_type: string }) {
    const router = useRouter();
    const [sanctionLoadTypeData, setSanctionLoadTypeData] = useState<SanctionLoadTypeData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterBody, setFilterBody] = useState<FilterBody>({
        period: '3',
        type: site_type
    });
    const supabase = createClient();

    // Effect to fetch data when filterBody changes
    useEffect(() => {
        fetchSanctionLoadData();
    }, [filterBody]);

    const fetchSanctionLoadData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            let query = supabase
                .from('bills')
                .select(`
                    id,
                    connection_id,
                    is_overload,
                    connections!inner(
                        account_number,
                        site_id,
                        biller_list!inner(
                            alias
                        ),
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

            // Apply filters
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

            // Process data to calculate connection types
            const connectionTypes = {
                'Normal': { connections: new Set(), sites: new Set(), bills: 0 },
                'Overload': { connections: new Set(), sites: new Set(), bills: 0 }
            };

            data.forEach((bill: any) => {
                const type = bill.is_overload ? 'Overload' : 'Normal';
                connectionTypes[type].connections.add(bill.connection_id);
                connectionTypes[type].sites.add(bill.connections.site_id);
                connectionTypes[type].bills++;
            });

            const chartData = Object.entries(connectionTypes).map(([type, counts]) => ({
                type,
                count: counts.connections.size,
                sites: counts.sites.size,
                bills: counts.bills,
                label: `${type}\n(${counts.connections.size} connections, ${counts.sites.size} sites, ${counts.bills} bills)`
            }));

            setSanctionLoadTypeData(chartData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyFilters = () => {
        fetchSanctionLoadData();
    };

    const handleClearFilter = () => {
        setFilterBody({});
        fetchSanctionLoadData();
    };

    const handleChartClick = (data: any) => {
        if (!data || !data.payload) return;

        // Construct the filter query
        const queryParams = new URLSearchParams();

        // Add existing filters if any
        if (filterBody.site_id) queryParams.append('site_id', filterBody.site_id);
        if (filterBody.zone_id) queryParams.append('zone_id', filterBody.zone_id);
        if (filterBody.type) queryParams.append('type', filterBody.type);
        if (filterBody.account_number) queryParams.append('account_number', filterBody.account_number);
        if (filterBody.biller_id) queryParams.append('biller_id', filterBody.biller_id);
        if (filterBody.due_date_start) queryParams.append('due_date_start', filterBody.due_date_start);
        if (filterBody.due_date_end) queryParams.append('due_date_end', filterBody.due_date_end);

        // Add connection type filter
        queryParams.append('is_overload', data.payload.type === 'Overload' ? 'true' : 'false');

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
    const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))'];

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
                        <CardTitle className="text-2xl font-semibold">Connection Load Analysis</CardTitle>
                        {isLoading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ReloadIcon className="h-4 w-4 animate-spin" />
                                <span>Updating...</span>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Distribution of connections based on billed demand vs sanctioned load
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
                                    onClick={fetchSanctionLoadData}
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
                                <span className="text-sm text-muted-foreground">Loading sanction load type data...</span>
                            </div>
                        </div>
                    ) : sanctionLoadTypeData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center">
                            <div className="rounded-full bg-muted p-4">
                                <ExclamationTriangleIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-medium">No sanction load type data available</p>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    Try adjusting your filters or selecting a different date range to view sanction load type distribution
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
                                <PieChart>
                                    <Pie
                                        data={sanctionLoadTypeData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={150}
                                        fill="#8884d8"
                                        dataKey="count"
                                        nameKey="type"
                                        onClick={handleChartClick}
                                        className="cursor-pointer"
                                    >
                                        {sanctionLoadTypeData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                className="transition-all duration-200 hover:opacity-80"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={<CustomTooltip />}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        wrapperStyle={{
                                            fontSize: '12px',
                                            marginTop: '8px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 