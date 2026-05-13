'use client';

import { snakeToTitle } from '@/lib/utils/string-format';
import { formatRupees } from '@/lib/utils/number-format';
import type { AllBillTableProps } from '@/types/bills-type';
import { Button } from '@/components/ui/button';
import { ListTree } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

const META = new Set(['id', 'created_at', 'updated_at']);

const NEGATIVE_KEYS = new Set([
  'tod_rebate',
  'interest_on_sd',
  'rebate_subsidy',
  'power_factor_incentive',
]);

function signedAmount(key: string, raw: number): number {
  if (NEGATIVE_KEYS.has(key)) return raw > 0 ? -raw : raw;
  return raw;
}

function linesFrom(
  obj: Record<string, unknown> | null | undefined
): { label: string; amount: string }[] {
  if (!obj) return [];
  const out: { label: string; amount: string }[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (META.has(key)) continue;
    if (typeof val !== 'number' || Number.isNaN(val) || val === 0) continue;
    const amt = signedAmount(key, val);
    out.push({
      label: snakeToTitle(key),
      amount: formatRupees(amt),
    });
  }
  return out;
}

export function BillChargesDisclosure({ bill }: { bill: AllBillTableProps }) {
  const sections: { title: string; lines: { label: string; amount: string }[] }[] = [
    { title: 'Core', lines: linesFrom(bill.core_charges as Record<string, unknown>) },
    { title: 'Regulatory', lines: linesFrom(bill.regulatory_charges as Record<string, unknown>) },
    { title: 'Adherence', lines: linesFrom(bill.adherence_charges as Record<string, unknown>) },
    { title: 'Additional', lines: linesFrom(bill.additional_charges as Record<string, unknown>) },
  ].filter((s) => s.lines.length > 0);

  if (sections.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1" type="button">
          <ListTree className="h-3.5 w-3.5" />
          Charges
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 max-h-80 overflow-y-auto p-3">
        <div className="space-y-3 text-sm">
          {sections.map((sec) => (
            <div key={sec.title}>
              <p className="font-semibold text-foreground">{sec.title}</p>
              <ul className="mt-1 space-y-1 border-l border-border pl-2">
                {sec.lines.map((line) => (
                  <li
                    key={line.label}
                    className="flex justify-between gap-2 text-muted-foreground"
                  >
                    <span className="min-w-0 flex-1 truncate">{line.label}</span>
                    <span className="shrink-0 tabular-nums text-foreground">{line.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
