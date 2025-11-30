'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Icon from '../icon';
import { formatNumber } from '@/lib/utils/number-format';
import Link from 'next/link';
import { DashboardData } from '@/types/dashboard-type';
import { useSiteName } from '@/lib/utils/site';

export const MetricCard: React.FC<DashboardData> = ({
  title,
  value,
  icon,
  status,
  value_type,
  path
}) => {
  const site_name = useSiteName();
  const isDisable = !status;
  
  // Replace "Stations" or "Station" with dynamic site name
  const displayTitle = title
    ?.replace(/Stations/gi, `${site_name}s`)
    ?.replace(/Station/gi, site_name);
  
  return (
    <Link href={`/portal/${path}`} scroll={false}>
      <Card
        className={isDisable ? 'bg-muted text-gray-600' : 'hover:bg-yellow-50'}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{displayTitle}</CardTitle>
          <Icon
            name={icon || 'Activity'}
            className="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {value_type == 1
              ? '₹' + formatNumber(Number(Number(value).toFixed(2)))
              : formatNumber(Number(Number(value).toFixed(2)))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
