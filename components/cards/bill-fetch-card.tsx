'use client';
import PendingAmountCard from '@/components/cards/pending-amount-card';
import BarChartBill from '@/components/charts/bar-chart-bill';
import Icon from '@/components/icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import IconButton from '@/components/buttons/icon-button';
import { formatNumber } from '@/lib/utils/number-format';
import { CardResult } from '@/types/bills-type';
import { LineChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

function BillFetchCard({
  chartDueDataData,
  chartDiscountDataData,
  all_bill_amount,
  lagCount,
  dueSummaryData
}: CardResult) {
  const [isGraph, setIsGraph] = useState(false);
  const toggleIsGraph = () => setIsGraph(!isGraph);
  const router = useRouter();
  return (
    <>
      <div className="flex flex-1 justify-end">
        <IconButton
          onClick={toggleIsGraph}
          text={isGraph ? 'Hide Graph' : 'Graph View'}
          icon={LineChart}
        />
      </div>
      {isGraph ? (
        <>
          <div className=" gap-4 space-y-6 py-6 md:flex">
            {chartDueDataData && chartDueDataData.length > 0 && (
              <BarChartBill chartData={chartDueDataData} dataKey="due_date" />
            )}
            {chartDiscountDataData && chartDiscountDataData.length > 0 && (
              <BarChartBill
                chartData={chartDiscountDataData}
                dataKey="discount_date"
              />
            )}
          </div>
        </>
      ) : null}
      <div className="space-y-6 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <PendingAmountCard dueDateSummary={dueSummaryData} />
          <div className="col-span-2 grid gap-6">
            <Card
              onClick={() => router.push('/portal/bill')}
              className="hover:bg-yellow-50"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Unit Consumed
                </CardTitle>
                <Icon
                  name={'IndianRupee'}
                  className="h-4 w-4 text-muted-foreground"
                />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-orange-500 hover:text-orange-600 ">
                  {formatNumber(all_bill_amount)}
                </div>
                <p className="text-sm text-gray-500">Including Overdue Bills</p>
              </CardContent>
            </Card>
            <Card
              onClick={() => router.push('/portal/payment')}
              className="hover:bg-yellow-50"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Lagged Payment
                </CardTitle>
                <Icon
                  name={'ChartLine'}
                  className="h-4 w-4 text-muted-foreground"
                />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-red-500">
                  {lagCount}
                </div>
                <p className="text-sm text-gray-500">Review them now</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default BillFetchCard;
