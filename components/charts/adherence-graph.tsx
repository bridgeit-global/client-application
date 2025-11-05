'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

function calculateSums(data: any) {
  const sums = {
    current_lpsc_positive: 0,
    current_lpsc_negative: 0,
    previous_lpsc_positive: 0,
    previous_lpsc_negative: 0,
    dishonor_cheque_charge_positive: 0,
    dishonor_cheque_charge_negative: 0
  };

  data.forEach((item: any) => {
    sums.current_lpsc_positive += Math.max(0, item.current_lpsc);
    sums.current_lpsc_negative += Math.min(0, item.current_lpsc);
    sums.previous_lpsc_positive += Math.max(0, item.previous_lpsc);
    sums.previous_lpsc_negative += Math.min(0, item.previous_lpsc);
    sums.dishonor_cheque_charge_positive += Math.max(
      0,
      item.dishonor_cheque_charge
    );
    sums.dishonor_cheque_charge_negative += Math.min(
      0,
      item.dishonor_cheque_charge
    );
  });

  return [
    {
      name: 'Current LPSC',
      positive: sums.current_lpsc_positive,
      negative: sums.current_lpsc_negative
    },
    {
      name: 'Previous LPSC',
      positive: sums.previous_lpsc_positive,
      negative: sums.previous_lpsc_negative
    },
    {
      name: 'Dishonor Cheque',
      positive: sums.dishonor_cheque_charge_positive,
      negative: sums.dishonor_cheque_charge_negative
    }
  ];
}

export function AdherenceGraph({ data = [] }: any) {
  const [summedData, setSummedData] = useState([]);

  useEffect(() => {
    setSummedData(calculateSums(data) as any);
  }, [data]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Charge Summary</CardTitle>
        <CardDescription>
          Sum of positive and negative charges for each category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            positive: {
              label: 'Positive Charge',
              color: 'hsl(var(--chart-1))'
            },
            negative: {
              label: 'Negative Charge',
              color: 'hsl(var(--chart-2))'
            }
          }}
          className="h-[400px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={summedData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ReferenceLine y={0} stroke="#000" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar
                dataKey="positive"
                fill="var(--color-positive)"
                name="Positive Charge"
              />
              <Bar
                dataKey="negative"
                fill="var(--color-negative)"
                name="Negative Charge"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
