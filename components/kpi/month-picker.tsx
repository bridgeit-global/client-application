'use client';

import * as React from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '@/components/calendar/calendar.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

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
  const selected = value || new Date();

  return (
    <div className="datepicker-container">
      <DatePicker
        selected={selected}
        onChange={(date: Date | null) => date && onSelect(date)}
        calendarClassName="custom-calendar"
        inline
        showMonthYearPicker
        showFullMonthYearPicker
        maxDate={maxDate}
        locale={enUS}
        renderCustomHeader={({
          date,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div className="month-navigation">
            <button
              type="button"
              onClick={decreaseMonth}
              className="month-nav-button prev"
              aria-label="Previous Month"
              disabled={prevMonthButtonDisabled}
            >
              <ChevronLeft />
            </button>
            <span className="month-label">{format(date, 'MMMM yyyy')}</span>
            <button
              type="button"
              onClick={increaseMonth}
              className="month-nav-button next"
              aria-label="Next Month"
              disabled={nextMonthButtonDisabled}
            >
              <ChevronRight />
            </button>
          </div>
        )}
        fixedHeight
      />
    </div>
  );
}
