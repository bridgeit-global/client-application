'use client';

import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { Checkbox } from '@/components/ui/checkbox';
import { snakeToTitle } from '@/lib/utils/string-format';

interface Bill {
  [key: string]: number | undefined;
}

interface ChartData {
  name: string;
  value: number;
}

interface ChartProp {
  billsData: Bill[];
  chargeName?: string;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
  'hsl(var(--chart-9))',
  'hsl(var(--chart-10))'
];

const RADIAN = Math.PI / 180;

const processData = (bill: Bill[]): ChartData[] => {
  const totalCharges: { [key: string]: number } = {};

  bill.forEach((bill) => {
    Object.entries(bill).forEach(([key, value]) => {
      if (typeof value === 'number') {
        totalCharges[key] = (totalCharges[key] || 0) + value;
      }
    });
  });

  return Object.entries(totalCharges)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={10}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 5) * cos;
  const sy = cy + (outerRadius + 5) * sin;
  const mx = cx + (outerRadius + 15) * cos;
  const my = cy + (outerRadius + 15) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 11;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={4} textAnchor="middle" fill={fill} fontSize={10}>
        {snakeToTitle(payload.name)}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 3}
        outerRadius={outerRadius + 5}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={1} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 6}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
        fontSize={10}
      >{`${snakeToTitle(payload.name)}: ${value.toFixed(2)}`}</text>
    </g>
  );
};

export default function ChargeChart({
  billsData,
  chargeName = 'All'
}: ChartProp) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [visibleCharges, setVisibleCharges] = useState<Set<string>>(new Set());

  const data = processData(billsData);
  const filteredData = data.filter(
    (item) => visibleCharges.has(item.name) || visibleCharges.size === 0
  );

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const toggleCharge = useCallback((charge: string) => {
    setVisibleCharges((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(charge)) {
        newSet.delete(charge);
      } else {
        newSet.add(charge);
      }
      return newSet;
    });
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl md:text-2xl">
          {snakeToTitle(chargeName)} Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row">
          <ChartContainer
            config={Object.fromEntries(
              data.map((item, index) => [
                item.name,
                { label: item.name, color: COLORS[index % COLORS.length] }
              ])
            )}
            className="h-[250px] w-full sm:h-[300px] sm:w-2/3 md:h-[350px] lg:h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  innerRadius="30%"
                  outerRadius="60%"
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  label={renderCustomizedLabel}
                  labelLine={false}
                >
                  {filteredData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-4 flex max-h-[250px] w-full flex-col justify-center overflow-y-auto sm:ml-4 sm:mt-0 sm:max-h-[300px] sm:w-1/3 md:max-h-[350px] lg:max-h-[400px]">
            {data.map((charge, index) => (
              <div key={charge.name} className="mb-2 flex items-center">
                <Checkbox
                  id={charge.name}
                  checked={
                    visibleCharges.has(charge.name) || visibleCharges.size === 0
                  }
                  onCheckedChange={() => toggleCharge(charge.name)}
                  className="h-3 w-3 border-2 border-gray-300 sm:h-4 sm:w-4"
                  style={{
                    backgroundColor:
                      visibleCharges.has(charge.name) ||
                        visibleCharges.size === 0
                        ? COLORS[index % COLORS.length]
                        : 'transparent'
                  }}
                />
                <label
                  htmlFor={charge.name}
                  className="ml-2 text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 sm:text-sm"
                >
                  {charge.name == 'sgst' || charge.name == 'cgst'
                    ? snakeToTitle(charge.name).toUpperCase()
                    : snakeToTitle(charge.name)}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
