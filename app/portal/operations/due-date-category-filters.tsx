'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  {
    value: 'overdue',
    label: 'Overdue',
    dotClass: 'bg-rose-400'
  },
  {
    value: 'seven_day',
    label: 'Next 7 Days',
    dotClass: 'bg-amber-400'
  },
  {
    value: 'next_seven_day',
    label: '7-14 Days',
    dotClass: 'bg-emerald-400'
  }
] as const;

type Props = {
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
};

/**
 * Quick due-date filters. Colored dots replace the old static Due Date legend
 * so urgency is actionable, not something to read.
 */
export function DueDateCategoryFilters({ value, onValueChange }: Props) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => onValueChange(next || undefined)}
      className="justify-start gap-2 bg-card p-2"
    >
      {CATEGORIES.map((category) => (
        <ToggleGroupItem
          key={category.value}
          value={category.value}
          aria-label={category.label}
          className="gap-2"
        >
          <span
            aria-hidden
            className={cn('h-2.5 w-2.5 shrink-0 rounded-full', category.dotClass)}
          />
          {category.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
