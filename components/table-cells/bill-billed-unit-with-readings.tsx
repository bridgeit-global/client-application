'use client';

import type { AllBillTableProps } from '@/types/bills-type';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { ddmmyy } from '@/lib/utils/date-format';

export function BillBilledUnitWithReadings({ bill }: { bill: AllBillTableProps }) {
  const readings = bill.meter_readings;
  const unit = bill.billed_unit;

  if (!readings?.length) {
    return <span className="tabular-nums">{unit}</span>;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link" className="h-auto p-0 tabular-nums" type="button">
          {unit}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <p className="text-sm font-semibold text-foreground">Meter readings</p>
        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
          {readings.map((r, i) => (
            <li key={`${r.meter_no ?? 'm'}-${i}`} className="rounded-md border border-border bg-card p-2">
              <p className="font-medium text-foreground">Type: {r.type || '—'}</p>
              <p>
                Period: {r.start_date ? ddmmyy(r.start_date) : '—'} →{' '}
                {r.end_date ? ddmmyy(r.end_date) : '—'}
              </p>
              <p>
                Start reading: {r.start_reading ?? '—'} · End reading: {r.end_reading ?? '—'}
              </p>
              <p>Multiplication factor: {r.multiplication_factor ?? '—'}</p>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}
