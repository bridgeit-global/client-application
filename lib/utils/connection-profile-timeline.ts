import type { TimelineItemProps } from '@/app/portal/profile/timeline-item';
import type { AllBillTableProps } from '@/types/bills-type';
import type { PaymentsProps } from '@/types/payments-type';

export function connectionPayloadForTimeline(
  bills: AllBillTableProps[] | undefined,
  payments: PaymentsProps[] | undefined
) {
  return {
    bills: bills || [],
    payments: payments || []
  };
}

export function convertConnectionToTimelineEvents(
  data: { bills: AllBillTableProps[]; payments: PaymentsProps[] },
  submeter_readings: unknown[] = []
): TimelineItemProps[] {
  const events: TimelineItemProps[] = [];

  if (submeter_readings && Array.isArray(submeter_readings)) {
    submeter_readings.forEach((raw) => {
      if (!raw || typeof raw !== 'object') return;
      const reading = raw as Record<string, unknown>;
      const end = Number(reading.end_reading || 0);
      const start = Number(reading.start_reading || 0);
      const readingDifference = end - start;
      const perDay = reading.per_day_unit;
      events.push({
        id: `submeter-${reading.connection_id}-${reading.reading_date}`,
        date: String(reading.reading_date || ''),
        title: 'Submeter Reading',
        type: 'submeter',
        billed_unit: `${readingDifference.toFixed(2)}`,
        description: `End: ${end}${perDay ? ` | Per day: ${perDay}` : ''}`,
        link: '',
        content_type: ''
      });
    });
  }

  if (data?.bills && Array.isArray(data.bills)) {
    data.bills.forEach((bill: AllBillTableProps) => {
      if (!bill) return;
      events.push({
        id: bill.id,
        date: bill.bill_date,
        title: 'Bill',
        link: bill.content,
        content_type: bill.content_type,
        bill_type: bill.bill_type,
        description: `₹${(bill.bill_amount || 0).toFixed(2)}`
      });
      events.push({
        id: bill.id,
        date: bill.due_date,
        title: 'DueDate',
        link: bill.content,
        bill_type: bill.bill_type,
        content_type: bill.content_type,
        description: `₹${(bill.bill_amount || 0).toFixed(2)}`
      });
    });
  }

  if (data?.payments && Array.isArray(data.payments)) {
    data.payments.forEach((payment: PaymentsProps) => {
      if (!payment) return;
      events.push({
        id: payment.id,
        date: payment.collection_date,
        title: 'Payment',
        link: payment.content || '',
        content_type: payment.content_type || '',
        description: `₹${(payment.amount || 0).toFixed(2)}`
      });
    });
  }

  return events.filter((event) => event.date);
}
