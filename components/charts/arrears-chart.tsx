'use client'
import {
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
} from "recharts";
import { formatRupees } from '@/lib/utils/number-format';
import { ArrearsProps } from "@/types/charges-type";


export function ArrearsChart({ data }: { data: ArrearsProps[] }) {
    // Process data to make it suitable for a stacked bar chart
    const chartData = data.map((item) => ({
        biller_id: item.biller_list.alias,
        "Positive Arrears": item.positive_arrears || 0,
        "Negative Arrears": item.negative_arrears || 0,
        "Bill Amount": item.bill_amount || 0,
        "Net Arrears": (item.positive_arrears || 0) + (item.negative_arrears || 0),
    }));

    // Custom tooltip formatter
    const formatTooltipValue = (value: number) => {
        return formatRupees(value);
    };

    return (
        <div>
            <h3 className="font-medium mb-3">Arrears Visualization</h3>
            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 70,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="biller_id"
                            angle={-45}
                            textAnchor="end"
                            tick={{ fontSize: 10 }}
                            tickMargin={10}
                        />
                        <YAxis
                            yAxisId="left"
                            tickFormatter={formatTooltipValue}
                            tick={{ fontSize: 10 }}
                            label={{
                                value: 'Arrears Amount',
                                angle: -90,
                                position: 'insideLeft',
                                style: { textAnchor: 'middle', fontSize: 12 }
                            }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickFormatter={formatTooltipValue}
                            tick={{ fontSize: 10 }}
                            label={{
                                value: 'Bill Amount',
                                angle: 90,
                                position: 'insideRight',
                                style: { textAnchor: 'middle', fontSize: 12 }
                            }}
                        />
                        <Tooltip
                            formatter={formatTooltipValue}
                            labelFormatter={(value) => `Board: ${value}`}
                            contentStyle={{ fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar
                            yAxisId="left"
                            dataKey="Positive Arrears"
                            stackId="a"
                            fill="#4ade80"
                            name="Positive Arrears"
                        />
                        <Bar
                            yAxisId="left"
                            dataKey="Negative Arrears"
                            stackId="a"
                            fill="#f87171"
                            name="Negative Arrears"
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="Bill Amount"
                            stroke="#60a5fa"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            name="Bill Amount"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
} 