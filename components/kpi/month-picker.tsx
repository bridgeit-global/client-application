'use client';

import * as React from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface MonthPickerProps {
  value?: Date;
  onSelect: (date: Date) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MonthPicker({
  value,
  onSelect,
  placeholder = 'Select month',
  className,
  disabled = false
}: MonthPickerProps) {
  const [month, setMonth] = React.useState<Date>(value || new Date());

  // Sync internal state with value prop
  React.useEffect(() => {
    if (value) {
      setMonth(value);
    }
  }, [value]);

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 5 + i
  );

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(month.getFullYear(), parseInt(monthIndex));
    setMonth(newDate);
    onSelect(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(parseInt(year), month.getMonth());
    setMonth(newDate);
    onSelect(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          aria-label={value ? format(value, 'MMMM yyyy') : placeholder}
          disabled={disabled}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {value ? format(value, 'MMMM yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex items-center space-x-2">
          <Select
            onValueChange={handleMonthChange}
            value={month.getMonth().toString()}
          >
            <SelectTrigger aria-label="Select month" className="w-[140px]">
              <SelectValue>{months[month.getMonth()]}</SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {months.map((monthName, index) => (
                <SelectItem key={monthName} value={index.toString()}>
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={handleYearChange}
            value={month.getFullYear().toString()}
          >
            <SelectTrigger aria-label="Select year" className="w-[100px]">
              <SelectValue>{month.getFullYear()}</SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
