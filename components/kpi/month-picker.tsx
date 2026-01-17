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
  maxDate?: Date;
}

export function MonthPicker({
  value,
  onSelect,
  placeholder = 'Select month',
  className,
  disabled = false,
  maxDate = new Date()
}: MonthPickerProps) {
  const [month, setMonth] = React.useState<Date>(value || new Date());

  // Sync internal state with value prop
  React.useEffect(() => {
    if (value) {
      setMonth(value);
    }
  }, [value]);

  const currentDate = new Date();
  const maxDateToUse = maxDate || currentDate;
  const maxYear = maxDateToUse.getFullYear();
  const maxMonth = maxDateToUse.getMonth();

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
    const selectedMonth = parseInt(monthIndex);
    const selectedYear = month.getFullYear();

    // Check if the selected month/year exceeds the max date
    if (selectedYear > maxYear || (selectedYear === maxYear && selectedMonth > maxMonth)) {
      return; // Don't allow selection beyond max date
    }

    const newDate = new Date(selectedYear, selectedMonth);
    setMonth(newDate);
    onSelect(newDate);
  };

  const handleYearChange = (year: string) => {
    const selectedYear = parseInt(year);
    const currentMonth = month.getMonth();

    // Check if the selected year/month exceeds the max date
    if (selectedYear > maxYear || (selectedYear === maxYear && currentMonth > maxMonth)) {
      // If the current month would exceed max, set to max month
      const newDate = new Date(selectedYear, Math.min(currentMonth, maxMonth));
      setMonth(newDate);
      onSelect(newDate);
      return;
    }

    const newDate = new Date(selectedYear, currentMonth);
    setMonth(newDate);
    onSelect(newDate);
  };

  const isMonthDisabled = (monthIndex: number, year: number): boolean => {
    return year > maxYear || (year === maxYear && monthIndex > maxMonth);
  };

  const isYearDisabled = (year: number): boolean => {
    // A year is disabled if all months in that year are beyond max date
    return year > maxYear;
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
              {months.map((monthName, index) => {
                const isDisabled = isMonthDisabled(index, month.getFullYear());
                return (
                  <SelectItem
                    key={monthName}
                    value={index.toString()}
                    disabled={isDisabled}
                  >
                    {monthName}
                  </SelectItem>
                );
              })}
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
              {years.map((year) => {
                const isDisabled = isYearDisabled(year);
                return (
                  <SelectItem
                    key={year}
                    value={year.toString()}
                    disabled={isDisabled}
                  >
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
