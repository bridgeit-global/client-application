'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Icon from '../icon';
import { MetricCard } from './metric-card';
import { DashboardData } from '@/types/dashboard-type';

function PaymentCard({
  dashboardData,
  totalCount
}: {
  dashboardData: DashboardData;
  totalCount: number;
}) {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="hover:bg-yellow-50">
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
              {totalCount}
            </div>
          </CardContent>
        </Card>
        <div className="col-span-2 grid gap-6">
          {dashboardData ? <MetricCard {...dashboardData} /> : null}
        </div>
      </div>
    </div>
  );
}

export default PaymentCard;
