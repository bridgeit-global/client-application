'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ddmmyy } from '@/lib/utils/date-format';
import { getPayment } from '@/lib/utils';
import { formatRupees } from '@/lib/utils/number-format';
import { AllBillTableProps } from '@/types/bills-type';
import ReceiptIndianRupee from '@/components/icons/receipt-indian-rupee';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import DocumentViewerModal from '@/components/modal/document-viewer-modal';
import PayTypeBadge from '@/components/badges/pay-type-badge';
import { DueDateCell } from '@/components/table-cells/due-date-cell';
import { ArrowUp } from 'lucide-react';
import { ArrowDown } from 'lucide-react';
import { ArrowUpDown } from 'lucide-react';
import { useSiteName } from '@/lib/utils/site';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
export const columns: ColumnDef<AllBillTableProps>[] = [

  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Due Date
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => <DueDateCell discount_date_str={row.original.discount_date} due_date_str={row.original.due_date} />,
    accessorKey: 'due_date'
  },
  {
    header: 'Approved Amount',
    cell: ({ row }) => {
      return row.original.approved_amount && formatRupees(row.original.approved_amount)
    }
  },
  {
    header: 'Paid Amount',
    cell: ({ row }) => {
      const { amount } = getPayment(row.original.connections.payments);
      return amount && formatRupees(amount)
    }
  },
  {
    header: 'Payment Date',
    cell: ({ row }) => {
      const { collection_date } = getPayment(row.original.connections.payments);
      if (collection_date) {
        const formattedDate = ddmmyy(collection_date);
        return formattedDate
      }
    }
  },

  {
    header: 'Start Date',
    cell: ({ row }) => {
      const start_date = row.original.start_date;
      if (start_date) {
        return ddmmyy(start_date)
      }
    }
  },
  {
    header: 'End Date',
    cell: ({ row }) => {
      const end_date = row.original.end_date;
      if (end_date) {
        return ddmmyy(end_date)
      }
    }
  },
  {
    header: 'Billed Unit',
    cell: ({ row }) => {
      const billed_unit = row.original.billed_unit;
      const meter_readings = row.original.meter_readings;

      if (billed_unit) {
        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link">{billed_unit}</Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Meter Readings</h4>
                {meter_readings?.map((reading, index) => (
                  <div key={index} className="text-sm">
                    <span>Start: {reading.start_reading}</span>
                    <span className="mx-2">-</span>
                    <span>End: {reading.end_reading}</span>
                  </div>
                ))}
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      }
    }
  },
  {
    header: 'UTR',
    cell: ({ row }) => {
      const { reference_id } = getPayment(row.original.connections.payments);
      if (reference_id) {
        return reference_id
      }
    }
  },
  {
    header: 'Receipt',
    cell: ({ row }) => {
      const { content, content_type } = getPayment(
        row.original.connections.payments
      );
      if (content) {
        return (
          <DocumentViewerModal
            icon={<ReceiptIndianRupee />}
            contentType={content_type}
            documentUrl={`${process.env.NEXT_PUBLIC_BUCKET_URL}/${content}`}
          />
        );
      }
    }
  }
];
