'use client';

import { formatRupees } from '@/lib/utils/number-format';
import { getEnergyBasedUnitCostValue } from '@/lib/utils/bill-export-charges';
import type { AllBillTableProps } from '@/types/bills-type';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface Props {
  bill: AllBillTableProps;
}

export function BillReportEnergyUnitCost({ bill }: Props) {
  const value = getEnergyBasedUnitCostValue(bill);
  if (value == null) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" type="button">
            <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-fit max-w-xs text-sm text-muted-foreground">
          Unit cost is energy charges divided by billed units. It cannot be shown when billed
          units are zero or energy charges are missing on this bill.
        </HoverCardContent>
      </HoverCard>
    );
  }
  return <span className="tabular-nums">{formatRupees(value)}</span>;
}
