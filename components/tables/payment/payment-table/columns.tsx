'use client';
import { ColumnDef } from '@tanstack/react-table';
import { formatRupees } from '@/lib/utils/number-format';
import { AllBillTableProps } from '@/types/bills-type';
import DocumentViewerModalWithPresigned from '@/components/modal/document-viewer-modal-with-presigned';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ArrowUpDown, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ddmmyy } from '@/lib/utils/date-format';
import { DueDateCell } from '@/components/table-cells/due-date-cell';
import { Button } from '@/components/ui/button';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
import { useSiteName } from '@/lib/utils/site';
export const postpaidColumns: ColumnDef<AllBillTableProps>[] = [
  {
    header: 'Action',
    enableResizing: false,
    cell: ({ row }) => {
      const router = useRouter();
      return (
        <div className="flex items-center gap-2">
          <Badge
            onClick={() =>
              router.push(`/portal/bills/${row.original.id}`)
            }
            variant={'outline'}
            className='cursor-pointer hover:bg-yellow-100 gap-1 items-center'
          >
            <Eye className='w-4 h-4' />
            Bill
          </Badge>
        </div>
      )
    }
  },
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    accessorKey: 'bill_amount',
    header: 'Bill Amount',
    cell: ({ row }) => formatRupees(row.original.bill_amount),
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
    header: 'Bill Copy',
    cell: ({ row }) => row.original.content ? <DocumentViewerModalWithPresigned
      contentType={row.original.content_type}
      fileKey={row.original.content}
    /> : null
  },
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