'use client'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { formatRupees } from '@/lib/utils/number-format';


interface ArrearsData {
    biller_id: string;
    connection_count: number;
    positive_arrears: number;
    negative_arrears: number;
    bill_amount: number;
}

export function ArrearsSideBySideChart({ data }: { data: ArrearsData[] }) {
    // Process data for chart
    const chartData = data.map((item) => ({
        biller_id: item.biller_id,
        "Positive Arrears": item.positive_arrears,
        "Negative Arrears": Math.abs(item.negative_arrears), // Convert to positive for display
        "Net Arrears": item.positive_arrears + item.negative_arrears,
        "Bill Amount": item.bill_amount,
    }));

    return (
        <div>
            <h3 className="font-medium mb-3">Arrears Comparison</h3>
            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
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
                            tick={{ fontSize: 12 }}
                            tickMargin={10}
                        />
                        <YAxis
                            tickFormatter={(value) => formatRupees(value)}
                        />
                        <Tooltip
                            formatter={(value) => formatRupees(Number(value))}
                        />
                        <Legend />
                        <Bar dataKey="Positive Arrears" fill="#4ade80" />
                        <Bar dataKey="Negative Arrears" fill="#f87171" />
                        <Bar dataKey="Bill Amount" fill="#60a5fa" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
} 