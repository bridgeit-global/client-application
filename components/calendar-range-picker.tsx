'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { CalendarIcon } from '@radix-ui/react-icons';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

interface CalendarRangePickerProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function CalendarRangePicker({ className }: CalendarRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: searchParams.get('dueDateStart')
      ? new Date(searchParams.get('dueDateStart') as string)
      : undefined,
    to: searchParams.get('dueDateEnd')
      ? new Date(searchParams.get('dueDateEnd') as string)
      : undefined
  });

  const createQueryString = React.useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams?.toString());

      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, value);
        }
      }

      return newSearchParams.toString();
    },
    [searchParams]
  );

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
  };

  const handleDoneClick = () => {
    if (date?.from || date?.to) {
      router.push(
        `${pathname}?${createQueryString({
          dueDateStart: date.from
            ? date.from.toISOString().split('T')[0]
            : null,
          dueDateEnd: date.to ? date.to.toISOString().split('T')[0] : null
        })}`,
        {
          scroll: false
        }
      );
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            id="date"
            variant="outline"
            className={cn(
              'justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
          <div className="border-t border-border p-3">
            <Button onClick={handleDoneClick} className="w-full">
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
