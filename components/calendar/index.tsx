'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './calendar.css';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { formatNumber } from '@/lib/utils/number-format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Bill {
  id: string;
  bill_status?: string;
  recharge_status?: string;
  bill_amount?: number;
  recharge_amount?: number;
  due_date?: string;
  bill_date?: string;
  recharge_date?: string;
  [key: string]: any;
}

interface SectionDetails {
  status: string;
  type: string;
}

interface BillGroup {
  count: number;
  totalAmount: number;
  events: BillEvent[];
}

interface BillEvent {
  id: string;
  title: number;
  start: Date;
  end: Date;
  bill: Bill;
}

interface DayGroupedBills {
  [dateKey: string]: {
    [status: string]: BillGroup[];
  };
}

interface CustomDayProps {
  date: Date;
  dayGroupedBills: DayGroupedBills;
  onDateCellEventClick: (date: Date, status: string, events: BillEvent[]) => void;
  sectionDetails: SectionDetails;
}

interface CalendarProps {
  billsData: any[];
  sectionDetails: SectionDetails;
}

interface SelectedDateRange {
  start: Date;
  end: Date;
}

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRange: SelectedDateRange | null;
  billsData: any[];
  sectionDetails: SectionDetails;
  dateType: 'due_date' | 'bill_date';
}

// Add type mapping for field names
const FIELD_MAPPING = {
  postpaid: {
    dateType: {
      due_date: 'due_date',
      bill_date: 'bill_date'
    },
    amountField: 'bill_amount',
    statusField: 'bill_status'
  },
  prepaid: {
    dateType: {
      due_date: 'recharge_date',
      bill_date: 'recharge_date'
    },
    amountField: 'recharge_amount',
    statusField: 'recharge_status'
  }
} as const;

// Update PATH_MAPPING to include prepaid paths
const PATH_MAPPING: Record<string, Record<string, string>> = {
  postpaid: {
    new: "portal/bills/new",
    approved: "portal/bills/approved",
    payment: "portal/bills/payment",
    paid: "portal/bills/paid",
    rejected: "portal/report/bill?bill_status=rejected",
    batch: "portal/batch-item"
  },
  prepaid: {
    new: "portal/recharges/low-balance",
    approved: "portal/recharges/approved",
    payment: "portal/recharges/payment",
    paid: "portal/recharges/paid",
    rejected: "portal/report/recharge",
    batch: "portal/batch-item"
  }
};

const getPathByStatusAndType = (status: string, type: string): string | undefined => {
  return PATH_MAPPING[type]?.[status];
};

const STATUS_COLORS: Record<string, string> = {
  new: '#f59e0b',
  approved: '#8b5cf6',
  batch: '#06b6d4',
  payment: '#64748b',
  paid: '#10b981',
  rejected: '#ef4444',
  default: '#64748b'
};

const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS.default;
};

// Function to group bills by day and status
const STATUS_ORDER = ['new', 'approved', 'batch', 'payment', 'paid', 'rejected'] as const;

const groupBillsByDayAndStatus = (bills: any[], dateType: string, type: 'postpaid' | 'prepaid'): DayGroupedBills => {
  const fieldMapping = FIELD_MAPPING[type];
  const statusField = fieldMapping.statusField;
  const amountField = fieldMapping.amountField;
  const dateField = fieldMapping.dateType[dateType as keyof typeof fieldMapping.dateType];

  const groupedByDay = bills.reduce((groupedByDay: DayGroupedBills, bill) => {
    if (!bill[dateField]) return groupedByDay;

    try {
      const dateValue = bill[dateField] as string;
      const dateKey = format(new Date(dateValue), 'yyyy-MM-dd');
      const status = bill[statusField] as string;

      if (!groupedByDay[dateKey]) {
        groupedByDay[dateKey] = {};
      }

      if (!groupedByDay[dateKey][status]) {
        groupedByDay[dateKey][status] = [{
          count: 0,
          totalAmount: 0,
          events: []
        }];
      }

      const currentGroup = groupedByDay[dateKey][status][0];
      if (currentGroup) {
        currentGroup.count += 1;
        currentGroup.totalAmount += Number(bill[amountField] || 0);
        currentGroup.events.push({
          id: bill.id,
          title: Number(bill[amountField] || 0),
          start: new Date(bill[dateField] as string),
          end: new Date(bill[dateField] as string),
          bill
        });
      }

      return groupedByDay;
    } catch (error) {
      console.error('Error processing bill:', error);
      return groupedByDay;
    }
  }, {});

  // Sort the statuses in each day according to STATUS_ORDER
  Object.keys(groupedByDay).forEach(dateKey => {
    const orderedStatuses: Record<string, BillGroup[]> = {};
    STATUS_ORDER.forEach(status => {
      if (groupedByDay[dateKey][status]) {
        orderedStatuses[status] = groupedByDay[dateKey][status];
      }
    });
    groupedByDay[dateKey] = orderedStatuses;
  });

  return groupedByDay;
};

// Add status display mapping
const STATUS_DISPLAY_MAPPING = {
  postpaid: {
    new: 'New',
    approved: 'Approved',
    batch: 'Batch',
    payment: 'Payment',
    paid: 'Paid',
    rejected: 'Rejected'
  },
  prepaid: {
    new: 'Low Balance',
    approved: 'Approved',
    batch: 'Batch',
    payment: 'Payment',
    paid: 'Paid',
    rejected: 'Rejected'
  }
} as const;

// Helper function to get end of day date
const getEndOfDay = (date: Date): Date => {
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  return endDate;
};

const DateRangeModal = ({ isOpen, onClose, selectedRange, billsData, sectionDetails, dateType }: DateRangeModalProps) => {
  if (!selectedRange) return null;

  const fieldMapping = FIELD_MAPPING[sectionDetails.type as 'postpaid' | 'prepaid'];
  const dateField = fieldMapping.dateType[dateType];
  const statusField = fieldMapping.statusField;
  const amountField = fieldMapping.amountField;

  // Get the appropriate title based on section type
  const modalTitle = sectionDetails.type === 'prepaid'
    ? `Recharges from ${format(selectedRange.start, 'MMM dd, yyyy')} to ${format(selectedRange.end, 'MMM dd, yyyy')}`
    : `Bills from ${format(selectedRange.start, 'MMM dd, yyyy')} to ${format(selectedRange.end, 'MMM dd, yyyy')}`;

  // Filter bills within the selected date range, including the end date
  const filteredBills = billsData.filter(bill => {
    if (!bill[dateField]) return false;
    const billDate = new Date(bill[dateField] as string);
    return isWithinInterval(billDate, {
      start: selectedRange.start,
      end: getEndOfDay(selectedRange.end)
    });
  });

  // Group bills by status
  const groupedByStatus = filteredBills.reduce((acc, bill) => {
    const status = bill[statusField] as string;
    if (!acc[status]) {
      acc[status] = {
        count: 0,
        totalAmount: 0,
        bills: []
      };
    }
    acc[status].count += 1;
    acc[status].totalAmount += Number(bill[amountField] || 0);
    acc[status].bills.push(bill);
    return acc;
  }, {} as Record<string, { count: number; totalAmount: number; bills: any[] }>);

  const handleStatusClick = (status: string) => {
    const link = getPathByStatusAndType(status, sectionDetails.type);
    if (!link) return;

    const dateParam = sectionDetails.type === 'prepaid' ? 'recharge_date' : dateType;
    const fullLink = `/${link}?page=1&limit=10&${dateParam}_start=${format(selectedRange.start, 'yyyy-MM-dd')}&${dateParam}_end=${format(selectedRange.end, 'yyyy-MM-dd')}`;
    window.location.href = fullLink;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {modalTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {STATUS_ORDER.map(status => {
            const group = groupedByStatus[status];
            if (!group) return null;

            const formattedStatus = STATUS_DISPLAY_MAPPING[sectionDetails.type as 'postpaid' | 'prepaid'][status as keyof typeof STATUS_DISPLAY_MAPPING.postpaid] || status;
            const statusColor = getStatusColor(status);

            return (
              <div
                key={status}
                className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => handleStatusClick(status)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{formattedStatus}</span>
                  <span className="text-sm text-gray-500">
                    {group.count} {sectionDetails.type === 'prepaid' ? 'recharges' : 'bills'}
                  </span>
                </div>
                <span className="text-lg font-semibold" style={{ color: statusColor }}>
                  ₹{formatNumber(group.totalAmount)}
                </span>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Update CustomDay component to handle selection
const CustomDay = React.memo(({ date, dayGroupedBills, onDateCellEventClick, sectionDetails, isSelected, onSelect }: CustomDayProps & { isSelected: boolean; onSelect: (date: Date) => void }) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayBills = dayGroupedBills[dateStr] || {};
  const isToday = isSameDay(date, new Date());

  const handleClick = React.useCallback((e: React.MouseEvent, status: string, statusEvents: BillEvent[]) => {
    e.stopPropagation();
    e.preventDefault();
    onDateCellEventClick(date, status, statusEvents);
  }, [date, onDateCellEventClick]);

  const handleDayClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(date);
  }, [date, onSelect]);

  return (
    <div
      className={`custom-day-cell ${isSelected ? 'selected' : ''}`}
      onClick={handleDayClick}
    >
      <div className={`day-number ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}>
        {date.getDate()}
      </div>
      <div className="bill-container">
        {Object.keys(dayBills).length > 0 ? (
          Object.entries(dayBills).map(([status, statusDataArray]) => {
            const data = statusDataArray[0];
            if (!data) return null;

            const statusColor = getStatusColor(status);
            const formattedStatus = STATUS_DISPLAY_MAPPING[sectionDetails.type as 'postpaid' | 'prepaid'][status as keyof typeof STATUS_DISPLAY_MAPPING.postpaid] || status;
            const statusClass = `bill-status-badge-${status.toLowerCase()}`;

            return (
              <div
                key={status}
                className={`bill-status-badge ${statusClass}`}
                onClick={(e) => handleClick(e, status, data.events)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClick(e as unknown as React.MouseEvent, status, data.events);
                  }
                }}
              >
                <div className="bill-status-content">
                  <span className="bill-count">
                    {data.count} {formattedStatus}
                  </span>
                  <span className="bill-amount" style={{ color: statusColor }}>
                    ₹{formatNumber(data.totalAmount)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-bill-container" />
        )}
      </div>
    </div>
  );
});

CustomDay.displayName = 'CustomDay';

function Calendar({ billsData, sectionDetails }: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateType, setDateType] = useState<'due_date' | 'bill_date'>('due_date');
  const [dayGroupedBills, setDayGroupedBills] = useState<DayGroupedBills>({});
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<SelectedDateRange | null>(null);

  const fieldMapping = FIELD_MAPPING[sectionDetails.type as 'postpaid' | 'prepaid'];
  const dateField = fieldMapping.dateType[dateType];

  const handleToday = React.useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const handleDateType = React.useCallback((type: 'due_date' | 'bill_date') => {
    setDateType(type);
  }, []);

  const handleDateCellEventClick = React.useCallback((clickedDate: Date, status: string, eventsForStatus: BillEvent[]) => {
    const filterDate = {
      start: format(clickedDate, 'yyyy-MM-dd'),
      end: format(clickedDate, 'yyyy-MM-dd')
    };

    const link = getPathByStatusAndType(status, sectionDetails.type);
    if (!link) return;

    // Use recharge_date for prepaid type, otherwise use the selected dateType
    const dateParam = sectionDetails.type === 'prepaid' ? 'recharge_date' : dateType;

    if (status == 'batch') {
      const filterBody = {
        [`${dateParam}_start`]: filterDate.start,
        [`${dateParam}_end`]: filterDate.end,
        page: 1,
        limit: 10
      }
      const fullLink = `/${link}?postpaid=${JSON.stringify(filterBody)}`;
      window.location.href = fullLink;
    } else {
      const fullLink = `/${link}?page=1&limit=10&${dateParam}_start=${filterDate.start}&${dateParam}_end=${filterDate.end}`;
      window.location.href = fullLink;
    }

  }, [dateType, sectionDetails.type]);

  const handleDateSelect = React.useCallback((date: Date) => {
    setSelectedDates(prev => {
      const newDates = [...prev];
      const dateIndex = newDates.findIndex(d => isSameDay(d, date));

      if (dateIndex === -1) {
        newDates.push(date);
      } else {
        newDates.splice(dateIndex, 1);
      }

      // Sort dates
      newDates.sort((a, b) => a.getTime() - b.getTime());

      // If we have at least 2 dates, update the range and open modal
      if (newDates.length >= 2) {
        setSelectedRange({
          start: newDates[0],
          end: getEndOfDay(newDates[newDates.length - 1])
        });
        setIsModalOpen(true);
      } else {
        setSelectedRange(null);
        setIsModalOpen(false);
      }

      return newDates;
    });
  }, []);

  const handleModalClose = React.useCallback(() => {
    setIsModalOpen(false);
    setSelectedDates([]);
    setSelectedRange(null);
  }, []);

  // Filter bills for the current month
  useEffect(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    const filteredBills = billsData.map(bill => ({
      id: bill.id,
      bill_status: 'bill_status' in bill ? bill.bill_status : undefined,
      recharge_status: 'recharge_status' in bill ? bill.recharge_status : undefined,
      bill_amount: 'bill_amount' in bill ? bill.bill_amount : undefined,
      recharge_amount: 'recharge_amount' in bill ? bill.recharge_amount : undefined,
      due_date: 'due_date' in bill ? bill.due_date : undefined,
      bill_date: 'bill_date' in bill ? bill.bill_date : undefined,
      recharge_date: 'recharge_date' in bill ? bill.recharge_date : undefined,
    })).filter(bill => {
      if (!bill[dateField]) return false;

      try {
        const billDate = new Date(bill[dateField] as string);
        return !isNaN(billDate.getTime()) && billDate >= monthStart && billDate <= monthEnd;
      } catch (error) {
        console.error('Error processing bill date:', error);
        return false;
      }
    });

    setDayGroupedBills(groupBillsByDayAndStatus(filteredBills, dateType, sectionDetails.type as 'postpaid' | 'prepaid'));
  }, [billsData, selectedDate, dateType, sectionDetails.type, dateField]);

  const renderCustomHeader = React.useCallback(({
    date,
    decreaseMonth,
    increaseMonth,
  }: {
    date: Date;
    decreaseMonth: () => void;
    increaseMonth: () => void;
  }) => (
    <div className="custom-datepicker-header">
      <div>
        <Button
          onClick={handleToday}
          className="today-button"
          size="sm"
        >
          Today
        </Button>
      </div>

      <div className="month-navigation">
        <button
          type="button"
          onClick={() => {
            decreaseMonth();
            const newDate = new Date(date);
            newDate.setMonth(date.getMonth() - 1);
            setSelectedDate(newDate);
          }}
          className="month-nav-button prev"
          aria-label="Previous Month"
        >
          <ChevronLeft />
        </button>
        <span className="month-label">
          {format(date, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={() => {
            increaseMonth();
            const newDate = new Date(date);
            newDate.setMonth(date.getMonth() + 1);
            setSelectedDate(newDate);
          }}
          className="month-nav-button next"
          aria-label="Next Month"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="date-type-buttons">
        {sectionDetails.type === 'postpaid' ? (
          <>
            <Button
              size="sm"
              onClick={() => handleDateType('due_date')}
              className={`date-type-button ${dateType === 'due_date' ? 'active-due' : ''}`}
              aria-pressed={dateType === 'due_date'}
            >
              Due Date
            </Button>
            <Button
              size="sm"
              onClick={() => handleDateType('bill_date')}
              className={`date-type-button ${dateType === 'bill_date' ? 'active-bill' : ''}`}
              aria-pressed={dateType === 'bill_date'}
            >
              Bill Date
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={() => handleDateType('due_date')}
            className={`date-type-button ${dateType === 'due_date' ? 'active-due' : ''}`}
            aria-pressed={dateType === 'due_date'}
          >
            Recharge Date
          </Button>
        )}
      </div>
    </div>
  ), [handleToday, handleDateType, dateType, sectionDetails.type, setSelectedDate]);

  // Update renderDayContents in DatePicker
  const renderDayContents = React.useCallback((dayOfMonth: number, date: Date) => (
    <CustomDay
      date={date}
      dayGroupedBills={dayGroupedBills}
      onDateCellEventClick={handleDateCellEventClick}
      sectionDetails={sectionDetails}
      isSelected={selectedDates.some(d => isSameDay(d, date))}
      onSelect={handleDateSelect}
    />
  ), [dayGroupedBills, handleDateCellEventClick, sectionDetails, selectedDates, handleDateSelect]);

  return (
    <div className="calendar-container">
      <div className="datepicker-container">
        <DatePicker
          selected={selectedDate}
          onChange={(date: Date | null) => date && setSelectedDate(date)}
          calendarClassName="custom-calendar"
          inline
          showMonthYearPicker={false}
          showFullMonthYearPicker={false}
          locale={enUS}
          renderCustomHeader={renderCustomHeader}
          renderDayContents={renderDayContents}
          fixedHeight
        />
      </div>
      <DateRangeModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        selectedRange={selectedRange}
        billsData={billsData}
        sectionDetails={sectionDetails}
        dateType={dateType}
      />
    </div>
  );
}

// Memoize the component after definition
const MemoizedCalendar = React.memo(Calendar);
MemoizedCalendar.displayName = 'Calendar';

export default MemoizedCalendar;
