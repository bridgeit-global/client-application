'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ddmmyy } from '@/lib/utils/date-format';
import { getPayment } from '@/lib/utils';
import { formatRupees } from '@/lib/utils/number-format';
import { AllBillTableProps } from '@/types/bills-type';
import ReceiptIndianRupee from '@/components/icons/receipt-indian-rupee';
import { Button } from '@/components/ui/button';
import DocumentViewerModal from '@/components/modal/document-viewer-modal';
import { DueDateCell } from '@/components/table-cells/due-date-cell';
import { ArrowUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ArrowDown } from 'lucide-react';
import { ArrowUpDown } from 'lucide-react';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
import { snakeToTitle } from '@/lib/utils/string-format';
import { useSiteName } from '@/lib/utils/site';
export const postpaidColumns: ColumnDef<AllBillTableProps>[] = [
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => {
      return <SiteAccountBoardCell row={row} />
    }
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
  },
  {
    header: 'Paid Status',
    cell: ({ row }) => row.original.paid_status ? <Badge variant={'outline'}>{snakeToTitle(row.original.paid_status)}</Badge> : null
  }
];


export const prepaidColumns: ColumnDef<PrepaidRechargeTableProps>[] = [
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    header: 'Recharge Amount',
    cell: ({ row }) => formatRupees(row.original.recharge_amount)
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Recharge Date
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
    cell: ({ row }) => ddmmyy(row.original.recharge_date),
    accessorKey: 'recharge_date'
  },
];