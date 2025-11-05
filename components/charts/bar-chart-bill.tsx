'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceArea,
  Brush
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Fullscreen, Minimize, ZoomIn, ZoomOut } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';
import { ChartData } from '@/types';
import { getLastWeekStart, getNextWeekEnd } from '@/lib/utils';
import { useZoomStore } from '@/lib/store/zoom-store';

type Props = {
  chartData: ChartData[];
  title?: string;
  dataKey: string;
};

export default function BarChartBill({
  chartData,
  title = 'Bills Overview',
  dataKey
}: Props) {
  const lastWeekStart = useMemo(() => getLastWeekStart(), []);
  const nextWeekEnd = useMemo(() => getNextWeekEnd(), []);
  const [brushStartIndex, setBrushStartIndex] = useState(0);
  const [brushEndIndex, setBrushEndIndex] = useState(chartData.length - 1);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const { zoomState, setZoomState } = useZoomStore();

  const toggleFullScreen = useCallback(
    () => setIsFullScreen((prev) => !prev),
    []
  );

  const formatXAxis = useCallback((dateString: number) => {
    return format(parseISO(new Date(dateString).toISOString()), 'MMM dd');
  }, []);

  const formatTooltipLabel = useCallback((dateString: number) => {
    return format(
      parseISO(new Date(dateString).toISOString()),
      'MMMM dd, yyyy'
    );
  }, []);

  const getAxisYDomain = useCallback(
    (from: string, to: string, ref: keyof ChartData, offset: number) => {
      const refData = chartData.slice(
        chartData.findIndex((d) => d[dataKey] === from),
        chartData.findIndex((d) => d[dataKey] === to) + 1
      );
      let [bottom, top] = [refData[0][ref], refData[0][ref]] as [
        number,
        number
      ];
      refData.forEach((d: any) => {
        if (d[ref] > top) top = d[ref] as number;
        if (d[ref] < bottom) bottom = d[ref] as number;
      });

      return [(bottom | 0) - offset, (top | 0) + offset];
    },
    [chartData, dataKey]
  );

  const zoom = useCallback(() => {
    let { refAreaLeft, refAreaRight } = zoomState;
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setZoomState({ ...zoomState, refAreaLeft: '', refAreaRight: '' });
      return;
    }

    if (refAreaLeft > refAreaRight)
      [refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft];

    const [bottom, top] = getAxisYDomain(
      refAreaLeft,
      refAreaRight,
      'paymentAmount',
      1
    );

    const startIndex = chartData.findIndex((d) => d[dataKey] === refAreaLeft);
    const endIndex = chartData.findIndex((d) => d[dataKey] === refAreaRight);

    setZoomState({
      ...zoomState,
      refAreaLeft: '',
      refAreaRight: '',
      left: refAreaLeft,
      right: refAreaRight,
      top,
      bottom,
      brushStartIndex: startIndex,
      brushEndIndex: endIndex
    });
  }, [zoomState, chartData, dataKey, getAxisYDomain, setZoomState]);

  const zoomOut = useCallback(() => {
    setZoomState({
      ...zoomState,
      left: 'dataMin',
      right: 'dataMax',
      top: 'dataMax+1',
      bottom: 'dataMin',
      refAreaLeft: '',
      refAreaRight: '',
      brushStartIndex,
      brushEndIndex
    });
  }, [zoomState, setZoomState, brushStartIndex, brushEndIndex]);

  const handleBrushChange = useCallback(
    (newBrushRange: { startIndex?: number; endIndex?: number }) => {
      if (
        newBrushRange.startIndex === undefined ||
        newBrushRange.endIndex === undefined
      )
        return;

      setZoomState({
        ...zoomState,
        left: chartData[newBrushRange.startIndex][dataKey],
        right: chartData[newBrushRange.endIndex][dataKey],
        brushStartIndex: newBrushRange.startIndex,
        brushEndIndex: newBrushRange.endIndex
      });
    },
    [zoomState, setZoomState, chartData, dataKey]
  );

  useEffect(() => {
    const startIndex = chartData.findIndex(
      (x) => new Date(x[dataKey]).getTime() >= lastWeekStart.getTime()
    );
    const endIndex = chartData.findIndex(
      (x) => new Date(x[dataKey]).getTime() >= nextWeekEnd.getTime()
    );

    setBrushStartIndex(startIndex >= 0 ? startIndex : 0);
    setBrushEndIndex(endIndex >= 0 ? endIndex : chartData.length - 1);

    setZoomState({
      ...zoomState,
      brushStartIndex: startIndex >= 0 ? startIndex : 0,
      brushEndIndex: endIndex >= 0 ? endIndex : chartData.length - 1
    });
  }, [chartData, dataKey, lastWeekStart, nextWeekEnd, setZoomState]);

  const memoizedChartData = useMemo(() => chartData, [chartData]);

  return (
    <>
      {isFullScreen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" />
      )}
      <Card
        className={`${
          isFullScreen ? 'fixed inset-4 z-50' : 'w-full'
        } mb-2 overflow-hidden`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleFullScreen}>
              {isFullScreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Fullscreen className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className={`h-[300px] w-full md:h-[400px]`}>
            <ChartContainer
              config={{
                totalAmount: {
                  label: 'Total Amount',
                  color: 'hsl(var(--chart-1))'
                },
                nonBatchCreatedAmount: {
                  label: 'Non-Batch Created Amount',
                  color: '#e8b158'
                },
                batchCreatedAmount: {
                  label: 'Batch Created Amount',
                  color: 'hsl(var(--chart-3))'
                },
                count: {
                  label: 'Bill Count',
                  color: 'hsl(var(--chart-4))'
                },
                paymentAmount: {
                  label: 'Payment Amount',
                  color: 'hsl(var(--chart-2))'
                }
              }}
              className={`h-[300px] w-full md:h-[400px]`}
            >
              <ResponsiveContainer
                className="select-none"
                width="100%"
                height="100%"
              >
                <BarChart
                  data={memoizedChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  onMouseDown={(e) =>
                    e &&
                    setZoomState({
                      ...zoomState,
                      refAreaLeft: e.activeLabel || ''
                    })
                  }
                  onMouseMove={(e) =>
                    zoomState.refAreaLeft &&
                    e &&
                    setZoomState({
                      ...zoomState,
                      refAreaRight: e.activeLabel || ''
                    })
                  }
                  onMouseUp={zoom}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    allowDataOverflow
                    dataKey={dataKey}
                    domain={[zoomState.left, zoomState.right]}
                    type="category"
                    tickFormatter={formatXAxis}
                    fontSize={10}
                  />
                  <YAxis
                    allowDataOverflow
                    domain={[zoomState.bottom, zoomState.top]}
                    type="number"
                    yAxisId="1"
                    fontSize={10}
                  />
                  <Tooltip labelFormatter={formatTooltipLabel} />
                  <Legend />
                  <Bar
                    yAxisId="1"
                    dataKey="paymentAmount"
                    fill="var(--color-paymentAmount)"
                    name="Paid"
                  />
                  <Bar
                    yAxisId="1"
                    dataKey="batchCreatedAmount"
                    fill="var(--color-batchCreatedAmount)"
                    name="Batch"
                  />
                  <Bar
                    yAxisId="1"
                    dataKey="nonBatchCreatedAmount"
                    fill="var(--color-nonBatchCreatedAmount)"
                    name="Remaining"
                  />
                  {zoomState.refAreaLeft && zoomState.refAreaRight ? (
                    <ReferenceArea
                      yAxisId="1"
                      x1={zoomState.refAreaLeft}
                      x2={zoomState.refAreaRight}
                      strokeOpacity={0.3}
                    />
                  ) : null}
                  <Brush
                    dataKey={dataKey}
                    height={30}
                    stroke="#e8b158"
                    tickFormatter={formatXAxis}
                    startIndex={zoomState.brushStartIndex}
                    endIndex={zoomState.brushEndIndex}
                    onChange={handleBrushChange}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
