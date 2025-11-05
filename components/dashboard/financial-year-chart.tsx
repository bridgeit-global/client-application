'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from 'xlsx';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useSiteType } from "@/hooks/use-site-type";
import { CHART_COLORS } from "@/constants/colors";

type FinancialData = {
    financial_year: string;
    station_type: string;
    total_amount: number;
    total_unit: number;
    total_bills: number;
    rate_per_unit: number;
};

type MetricType = 'total_amount' | 'total_unit' | 'total_bills' | 'rate_per_unit';

type ChartData = {
    financial_year: string;
    [key: string]: string | number;
};

type Props = {
    data: FinancialData[];
};

export default function FinancialYearChart({ data }: Props) {

    const SITE_TYPES = useSiteType();

    const processDataForMetric = (metric: MetricType): ChartData[] => {
        if (metric === 'rate_per_unit') {
            const amountData = data.reduce((acc: ChartData[], curr) => {
                // Skip entries with null station_type
                if (!curr.station_type) {
                    return acc;
                }

                const existingYear = acc.find(item => item.financial_year === curr.financial_year);
                const amount = curr.total_amount;
                const units = curr.total_unit;
                const rate = units > 0 ? amount / units : 0;

                if (existingYear) {
                    existingYear[curr.station_type] = rate;
                    // Store amounts and units for total calculation
                    existingYear[`${curr.station_type}_amount`] = amount;
                    existingYear[`${curr.station_type}_units`] = units;
                } else {
                    const newYear: ChartData = {
                        financial_year: curr.financial_year,
                        [curr.station_type]: rate,
                        [`${curr.station_type}_amount`]: amount,
                        [`${curr.station_type}_units`]: units,
                        Total: rate
                    };
                    acc.push(newYear);
                }
                return acc;
            }, []);

            // Calculate total rate per unit correctly
            return amountData.map(({ financial_year, ...rest }) => {
                const totalAmount = Object.entries(rest)
                    .filter(([key]) => key.endsWith('_amount'))
                    .reduce((sum, [_, value]) => sum + (value as number), 0);

                const totalUnits = Object.entries(rest)
                    .filter(([key]) => key.endsWith('_units'))
                    .reduce((sum, [_, value]) => sum + (value as number), 0);

                const totalRate = totalUnits > 0 ? totalAmount / totalUnits : 0;

                // Remove temporary fields and add correct total
                const cleanRest = Object.fromEntries(
                    Object.entries(rest).filter(([key]) => !key.endsWith('_amount') && !key.endsWith('_units'))
                );

                return {
                    financial_year,
                    ...cleanRest,
                    Total: totalRate
                };
            });
        }

        const result = data.reduce((acc: ChartData[], curr) => {
            // Skip entries with null station_type
            if (!curr.station_type) {
                return acc;
            }

            const existingYear = acc.find(item => item.financial_year === curr.financial_year);
            const value = metric === 'total_bills' ? curr[metric] : curr[metric];

            if (existingYear) {
                existingYear[curr.station_type] = value;
            } else {
                acc.push({
                    financial_year: curr.financial_year,
                    [curr.station_type]: value,
                });
            }
            return acc;
        }, []);

        // Calculate totals after all data is processed
        return result.map(row => {
            const valuesForTotal = Object.entries(row)
                .filter(([key]) => key !== 'financial_year')
                .map(([_, value]) => Number(value) || 0);
            const total = valuesForTotal.reduce((sum, val) => sum + val, 0);
            return {
                ...row,
                Total: total
            };
        });
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
        return numValue.toString();
    };

    const metrics = [
        { id: 'total_amount' as MetricType, label: 'Total Amount', color: '#8884d8' },
        { id: 'total_unit' as MetricType, label: 'Total Units', color: '#82ca9d' },
        { id: 'total_bills' as MetricType, label: 'Total Bills', color: '#ffc658' },
        { id: 'rate_per_unit' as MetricType, label: 'Rate per Unit', color: '#ff7300' }
    ];

    const exportToExcel = () => {
        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();

        // Process data for each metric
        metrics.forEach((metric) => {
            const sheetData = processDataForMetric(metric.id).map(row => ({
                'Financial Year': row.financial_year,
                ...Object.entries(row).filter(([key]) => key !== 'financial_year').reduce((acc: any, [key, value]) => {
                    acc[key] = value ? formatValue(value, metric.id) : '-';
                    return acc;
                }, {}),
                'Total': row.Total ? formatValue(row.Total, metric.id) : '-'
            }));

            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(sheetData);

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, metric.label);
        });

        // Save the file
        XLSX.writeFile(workbook, 'financial_year_analysis.xlsx');
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Financial Year Analysis</CardTitle>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToExcel}
                    className="flex items-center gap-2"
                >
                    <Download className="h-4 w-4" />
                    Export to Excel
                </Button>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="total_amount" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        {metrics.map((metric) => (
                            <TabsTrigger key={metric.id} value={metric.id}>
                                {metric.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {metrics.map((metric) => {
                        const chartData = processDataForMetric(metric.id);
                        const availableSiteTypes = SITE_TYPES.filter(type =>
                            chartData.some(row => row[type.value] !== undefined)
                        );

                        return (
                            <TabsContent key={metric.id} value={metric.id}>
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={chartData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="financial_year" />
                                            <YAxis
                                                tickFormatter={(value) => formatValue(value, metric.id)}
                                            />
                                            <Tooltip
                                                formatter={(value) => formatValue(value, metric.id)}
                                            />
                                            <Legend />
                                            {availableSiteTypes.map((type, index) => (
                                                <Bar key={type.value} dataKey={type.value} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                            <Bar dataKey="Total" fill="#ff7300" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Table View */}
                                <div className="mt-8">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Financial Year</TableHead>
                                                {availableSiteTypes.map((type) => (
                                                    <TableHead key={type.value}>{type.label}</TableHead>
                                                ))}
                                                <TableHead>Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {chartData.map((row) => (
                                                <TableRow key={row.financial_year}>
                                                    <TableCell>{row.financial_year}</TableCell>
                                                    {availableSiteTypes.map((type) => (
                                                        <TableCell key={type.value}>
                                                            {row[type.value] ? formatValue(row[type.value], metric.id) : '-'}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell>
                                                        {row.Total ? formatValue(row.Total, metric.id) : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        );
                    })}
                </Tabs>
            </CardContent>
        </Card>
    );
} 