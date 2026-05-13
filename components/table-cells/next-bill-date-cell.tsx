'use client';

import { ddmmyy } from '@/lib/utils/date-format';
import { Calendar } from 'lucide-react';

export function NextBillDateCell({
  next_bill_date,
  is_active = true,
}: {
  next_bill_date: string | null | undefined;
  is_active?: boolean;
}) {
  if (!next_bill_date) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const date = new Date(next_bill_date);
  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffMs = date.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let hint = '';
  if (is_active) {
    if (diffDays < 0) {
      hint = `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} past`;
    } else if (diffDays === 0) {
      hint = 'Today';
    } else {
      hint = `${diffDays} day${diffDays !== 1 ? 's' : ''} away`;
    }
  }

  return (
    <div className="flex min-w-[100px] flex-col gap-0.5 rounded-lg border border-border bg-muted/30 p-2">
      <div className="flex items-center gap-1.5 text-foreground">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-medium">{ddmmyy(next_bill_date)}</span>
      </div>
      {is_active && hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  );
}
