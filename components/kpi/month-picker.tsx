'use client';

import { addMonths, format, isAfter, startOfMonth, subMonths } from 'date-fns';
import '@/components/calendar/calendar.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  className,
  disabled = false,
  maxDate = new Date()
}: MonthPickerProps) {
  const selected = startOfMonth(value || new Date());
  const maxMonth = startOfMonth(maxDate);

  const prevMonth = subMonths(selected, 1);
  const nextMonth = addMonths(selected, 1);
  const prevDisabled = disabled;
  const nextDisabled = disabled || isAfter(nextMonth, maxMonth);

  return (
    <div className={`datepicker-container ${className ?? ''}`.trim()}>
      <div className="month-navigation">
        <button
          type="button"
          onClick={() => onSelect(prevMonth)}
          className="month-nav-button prev"
          aria-label="Previous Month"
          disabled={prevDisabled}
        >
          <ChevronLeft />
        </button>

        <span className="month-label">{format(selected, 'MMMM yyyy')}</span>

        <button
          type="button"
          onClick={() => onSelect(nextMonth)}
          className="month-nav-button next"
          aria-label="Next Month"
          disabled={nextDisabled}
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
