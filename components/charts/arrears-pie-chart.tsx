'use client'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";
import { formatRupees } from '@/lib/utils/number-format';


interface ArrearsData {
    biller_id: string;
    connection_count: number;
    positive_arrears: number;
    negative_arrears: number;
    bill_amount: number;
}

export function ArrearsPieChart({ data }: { data: ArrearsData[] }) {
    // Aggregate total positive and negative arrears
    const totalPositive = data.reduce((sum, item) => sum + item.positive_arrears, 0);
    const totalNegative = data.reduce((sum, item) => sum + Math.abs(item.negative_arrears), 0);

    const pieData = [
        { name: "Positive", value: totalPositive },
        { name: "Negative", value: totalNegative },
    ];

    const COLORS = ["#4ade80", "#f87171"];

    return (
        <div>
            <h3 className="font-medium mb-3">Arrears Distribution</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value, percent, x, y, midAngle }) => {
                                return (
                                    <g>
                                        <text
                                            x={x}
                                            y={y}
                                            fill="#000"
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fontSize={10}
                                            fontWeight="bold"
                                        >
                                            {`${name}`}
                                        </text>
                                        <text
                                            x={x}
                                            y={y + 15}
                                            fill="#000"
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fontSize={9}
                                        >
                                            {`${formatRupees(value)}`}
                                        </text>
                                    </g>
                                );
                            }}
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => formatRupees(Number(value))}
                            contentStyle={{ fontSize: 10 }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            wrapperStyle={{ fontSize: 11 }}
                            iconSize={10}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
} 