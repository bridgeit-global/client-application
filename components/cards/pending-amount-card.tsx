import Link from 'next/link';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/icon';
import { formatNumber } from '@/lib/utils/number-format';
import { Button } from '@/components/ui/button';
import { WeekGroup } from '@/types/dashboard-type';

interface PendingAmountCardProps {
  dueDateSummary: WeekGroup[];
}

const PendingAmountCard: React.FC<PendingAmountCardProps> = ({
  dueDateSummary
}) => {
  // Check if total_amount at index 0 is zero, and use index 1 if available
  const primaryAmount =
    dueDateSummary[0]?.total_amount === 0 && dueDateSummary[1]
      ? dueDateSummary[1].total_amount
      : dueDateSummary[0]?.total_amount;

  const primaryLabel =
    dueDateSummary[0]?.total_amount === 0 && dueDateSummary[1]
      ? dueDateSummary[1].label
      : dueDateSummary[0]?.label;

  return (
    <Card className="hover:bg-yellow-50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
        <Icon name="IndianRupee" className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div>
          <Link href={`/portal/${dueDateSummary[0]?.path}`} scroll={false}>
            <div className="flex items-center justify-between hover:text-red-500 hover:underline">
              <div className="text-3xl font-semibold text-red-500">
                {'₹' + formatNumber(primaryAmount)}
              </div>
              {dueDateSummary[0]?.total_count && dueDateSummary[0]?.total_count > 0 && (
                <div className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-600">
                  {dueDateSummary[0].total_count} bills
                </div>
              )}
            </div>
            <p className="mb-3 mt-2 text-sm text-gray-500 hover:text-red-500 hover:underline">
              {primaryLabel}
            </p>
          </Link>

          {dueDateSummary &&
            dueDateSummary
              .slice(1, dueDateSummary.length)
              .map((bill, index) => (
                <Link key={index + 1} href={`/portal/${bill.path}`} scroll={false}>
                  <div className="mb-2 flex items-center justify-between hover:text-red-500 hover:underline"   >
                    <span className="font-light">{bill.label}</span>
                    <div className="flex items-center gap-2">
                      <span>{'₹' + formatNumber(bill.total_amount)}</span>
                      {bill.total_count && bill.total_count > 0 && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {bill.total_count}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
        </div>
        <div className="text-xs text-muted-foreground text-right">
          Updated daily
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingAmountCard;
