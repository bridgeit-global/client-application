'use client'
import React, { useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Filter, FilterX } from "lucide-react";
import * as XLSX from 'xlsx';
import { Input } from "@/components/ui/input";
import { BillerBoardSelector } from '@/components/input/biller-board-selector';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StationTypeSelector } from '../input/station-type-selector';
import { Sheet as SheetComponent, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import IconButton from '../buttons/icon-button';
import { Label } from '../ui/label';
import { createQueryString } from '@/lib/createQueryString';
import { useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { getFilterDataLength } from '@/lib/utils/table';
import FilterChips from '../filter-chip';
import { LoadingButton } from '../buttons/loading-button';
import { useSiteName } from '@/lib/utils/site';
import { useSiteType } from '@/hooks/use-site-type';
import { CHART_COLORS } from '@/constants/colors';

type FinancialData = {
    bill_month: string;
    station_type: string | null;
    total_bill_amount: number;
    total_billed_unit: number;
    bill_count: number;
    average_rate: number;
};

type MetricType = 'total_amount' | 'total_unit' | 'total_bills' | 'rate_per_unit' | 'total_unit_per_rate';

type ChartData = {
    month: string;
    [key: string]: string | number;
};

type Props = {
    data?: FinancialData[];
};

type FilterActionProps = {
    filterBody: any;
    setFilterBody: any;
    handleApplyFilters: any;
    handleClearFilter: any;
};

function FilterAction({
    filterBody,
    setFilterBody,
    handleApplyFilters,
    handleClearFilter,
}: FilterActionProps) {
    const site_name = useSiteName();
    const onChangeHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterBody((prev: any) => ({
            ...prev,
            [e.target.id]: e.target.value
        }));
    };

    const onChangeSelectHandle = (key: string, value: string | string[]) => {
        setFilterBody((prev: any) => ({
            ...prev,
            [key]: Array.isArray(value) ? value.join(',') : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleApplyFilters();
    };

    return (
        <SheetComponent>
            <SheetTrigger asChild>
                <IconButton variant="outline" icon={Filter} text="Filter" />
            </SheetTrigger>
            <SheetContent className="w-full sm:w-[400px]" side="right">
                <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
                    <div className="grid gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="site_id">{site_name} ID</Label>
                            <Input
                                id="site_id"
                                value={filterBody.site_id}
                                onChange={onChangeHandle}
                                placeholder={`Enter ${site_name} ID`}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <BillerBoardSelector
                                onChange={(value) => onChangeSelectHandle('biller_id', value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="station_type">{site_name} Type</Label>
                            <StationTypeSelector
                                value={Array.isArray(filterBody?.type) ? filterBody.type : filterBody?.type?.split(',') || []}
                                onChange={(types) => onChangeSelectHandle("type", types)} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                        <SheetClose asChild>
                            <Button type="submit" className="w-full">
                                Find
                            </Button>
                        </SheetClose>
                        <SheetClose asChild>
                            <Button
                                type="button"
                                className="w-full text-black"
                                variant="link"
                                onClick={handleClearFilter}
                            >
                                Clear <FilterX className="ml-2 h-4 w-4" />
                            </Button>
                        </SheetClose>
                    </div>
                </form>
            </SheetContent>
        </SheetComponent>
    );
}

export default function FinancialMonthChart({ data }: Props) {

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const params = Object.fromEntries(searchParams.entries());
    const [filterBody, setFilterBody] = useState(params);
    const SITE_TYPES = useSiteType();
    const applyFilters = useCallback(() => {
        router.push(
            `${pathname}?${createQueryString(searchParams, filterBody)}`,
            {
                scroll: false
            }
        );
    }, [router, pathname, createQueryString, filterBody]);

    const handleClearFilter = useCallback(() => {
        setFilterBody({});
        router.push(pathname, { scroll: false });
    }, [router, pathname]);

    const processDataForMetric = (metric: MetricType): ChartData[] => {
        if (!data || data.length === 0) return [];

        const getValue = (item: FinancialData, metric: MetricType): number => {
            switch (metric) {
                case 'total_amount':
                    return item.total_bill_amount || 0;
                case 'total_unit':
                    return item.total_billed_unit || 0;
                case 'total_bills':
                    return item.bill_count || 0;
                case 'rate_per_unit':
                    return item.average_rate || 0;
                case 'total_unit_per_rate':
                    const totalUnit = item.total_billed_unit || 0;
                    const totalBills = item.bill_count || 0;
                    return totalBills > 0 ? totalUnit / totalBills : 0;
                default:
                    return 0;
            }
        };

        const formatMonth = (billMonth: string): string => {
            const [year, month] = billMonth.split('-');
            const monthNames: { [key: string]: string } = {
                '01': 'Jan',
                '02': 'Feb',
                '03': 'Mar',
                '04': 'Apr',
                '05': 'May',
                '06': 'Jun',
                '07': 'Jul',
                '08': 'Aug',
                '09': 'Sep',
                '10': 'Oct',
                '11': 'Nov',
                '12': 'Dec'
            };

            // For January, include the year
            if (month === '01') {
                return `Jan ${year}`;
            }

            return monthNames[month] || month;
        };

        const result = data.reduce((acc: ChartData[], curr) => {
            if (!curr || !curr.station_type) return acc; // Skip null/undefined data or null station types

            const month = formatMonth(curr.bill_month);
            const existingMonth = acc.find(item => item.month === month);
            const value = getValue(curr, metric);

            if (existingMonth) {
                existingMonth[curr.station_type] = value;
            } else {
                const monthData = {
                    month,
                    [curr.station_type]: value,
                };
                acc.push(monthData);
            }
            return acc;
        }, []);

        // Calculate totals after all data is processed
        result.forEach(monthData => {
            if (metric === 'rate_per_unit') {
                // For rate per unit, calculate total amount divided by total units
                const monthDataForTotal = data.filter(d => formatMonth(d.bill_month) === monthData.month);
                const totalAmount = monthDataForTotal.reduce((sum, d) => sum + (d.total_bill_amount || 0), 0);
                const totalUnits = monthDataForTotal.reduce((sum, d) => sum + (d.total_billed_unit || 0), 0);
                monthData.Total = totalUnits > 0 ? totalAmount / totalUnits : 0;
            } else {
                // Calculate total based on the actual values in the chart data
                const total = Object.entries(monthData)
                    .filter(([key]) => key !== 'month' && key !== 'Total')
                    .reduce((sum, [_, value]) => sum + Number(value || 0), 0);
                monthData.Total = total;
            }
        });

        return result;
    };

    const formatValue = (value: any, metric: MetricType): string => {
        const numValue = Number(value);
        if (metric === 'total_amount') {
            return `₹${(numValue / 100000).toFixed(2)}L`;
        }
        if (metric === 'rate_per_unit') {
            return `₹${numValue.toFixed(2)}`;
        }
        if (metric === 'total_unit') {
            return `${(numValue / 1000).toFixed(2)}K`;
        }
        if (metric === 'total_unit_per_rate') {
            return `${numValue.toFixed(2)} units/bill`;
        }
        return numValue.toString();
    };

    const metrics = [
        { id: 'total_amount' as MetricType, label: 'Total Amount', color: '#8884d8' },
        { id: 'total_unit' as MetricType, label: 'Total Units', color: '#82ca9d' },
        { id: 'total_bills' as MetricType, label: 'Total Bills', color: '#ffc658' },
        { id: 'rate_per_unit' as MetricType, label: 'Rate per Unit', color: '#ff7300' },
    ];

    const exportToExcel = () => {
        const workbook = XLSX.utils.book_new();

        metrics.forEach((metric) => {
            const sheetData = processDataForMetric(metric.id).map(row => ({
                'Month': row.month,
                ...Object.entries(row).filter(([key]) => key !== 'month').reduce((acc: any, [key, value]) => {
                    acc[key] = value ? formatValue(value, metric.id) : '-';
                    return acc;
                }, {}),
                'Total': row.Total ? formatValue(row.Total, metric.id) : '-'
            }));

            const worksheet = XLSX.utils.json_to_sheet(sheetData);
            XLSX.utils.book_append_sheet(workbook, worksheet, metric.label);
        });

        XLSX.writeFile(workbook, 'financial_month_analysis.xlsx');
    };

    const filterCount = useMemo(() => getFilterDataLength(filterBody), [filterBody]);

    const BAR_COLORS = useMemo(() => {
        const colors: Record<string, string> = { Total: '#ff7300' };
        if (Array.isArray(SITE_TYPES) && SITE_TYPES.length > 0) {
            SITE_TYPES.forEach((type: any, index: number) => {
                colors[type.value] = CHART_COLORS[index % CHART_COLORS.length];
            });
        }
        return colors;
    }, [SITE_TYPES]);

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Monthly Financial Analysis</CardTitle>
                <div className="flex gap-2">
                    <FilterAction
                        filterBody={filterBody}
                        setFilterBody={setFilterBody}
                        handleApplyFilters={applyFilters}
                        handleClearFilter={handleClearFilter}
                    />
                    {filterCount > 0 ? (
                        <Button onClick={handleClearFilter}>
                            {filterCount} <FilterX className="ml-2 h-4 w-4" />
                        </Button>
                    ) : null}
                    <LoadingButton
                        icon={Download}
                        variant="outline"
                        onClick={exportToExcel}
                    >
                        <div className="hidden md:block">Export</div>
                    </LoadingButton>
                </div>
            </CardHeader>
            <div className="m-2">
                <FilterChips
                    filterBody={filterBody}
                    setFilterBody={setFilterBody}
                    fetchData={applyFilters}
                />
            </div>
            <CardContent>
                <Tabs defaultValue="total_amount" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        {metrics.map((metric) => (
                            <TabsTrigger key={metric.id} value={metric.id}>
                                {metric.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {metrics.map((metric) => (
                        <TabsContent key={metric.id} value={metric.id}>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={processDataForMetric(metric.id)}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis
                                            tickFormatter={(value) => formatValue(value, metric.id)}
                                        />
                                        <Tooltip
                                            formatter={(value) => formatValue(value, metric.id)}
                                        />
                                        <Legend />
                                        {
                                            filterBody.type ?
                                                filterBody.type.split(',').map((type: string) => (
                                                    <Bar key={type} dataKey={type} fill={BAR_COLORS[type as keyof typeof BAR_COLORS]} />
                                                ))
                                                :
                                                SITE_TYPES.map((type) => (
                                                    <Bar key={type.value} dataKey={type.value} fill={BAR_COLORS[type.value as keyof typeof BAR_COLORS]} />
                                                ))
                                        }
                                        <Bar dataKey="Total" fill={BAR_COLORS.Total} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-8">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Month</TableHead>
                                            {filterBody.type ?
                                                filterBody.type.split(',').map((type: string) => (
                                                    <TableHead key={type}>{type}</TableHead>
                                                ))
                                                :
                                                SITE_TYPES.map((type) => (
                                                    <TableHead key={type.value}>{type.label}</TableHead>
                                                ))
                                            }
                                            <TableHead>Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {processDataForMetric(metric.id).map((row) => (
                                            <TableRow key={row.month}>
                                                <TableCell>{row.month}</TableCell>
                                                {filterBody.type ?
                                                    filterBody.type.split(',').map((type: string) => (
                                                        <TableCell key={type}>
                                                            {row[type] ? formatValue(row[type], metric.id) : '-'}
                                                        </TableCell>
                                                    ))
                                                    :
                                                    SITE_TYPES.map((type) => (
                                                        <TableCell key={type.value}>
                                                            {row[type.value] ? formatValue(row[type.value], metric.id) : '-'}
                                                        </TableCell>
                                                    ))
                                                }
                                                <TableCell>
                                                    {row.Total ? formatValue(row.Total, metric.id) : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
} 