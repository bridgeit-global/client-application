'use client';
import { formatRupees } from '@/lib/utils/number-format';
import { ColumnDef } from '@tanstack/react-table';
import { AllBillTableProps } from '@/types/bills-type';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { DueDateCell } from '@/components/table-cells/due-date-cell';
import { ddmmyy } from '@/lib/utils/date-format';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { RemoveRechargeFromBatchButton } from '@/components/buttons/remove-recharge-from-batch-button';
import StatusBadge from '@/components/badges/status-badge';
import PaidBadge from '@/components/badges/paid-badge';
import { Button } from '@/components/ui/button';
import TodaysPayableAmountCell from '@/components/table-cells/todays-payable-amount-cell';
import { BillStatusBadge } from '@/components/badges/bill-status-badge';
import { BatchBillCellAction } from '../../../badges/batch-bill-cell-action';
import ViewBillButton from '@/components/buttons/view-bill-button';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
import { useSiteName } from '@/lib/utils/site';
export const postpaidColumns: ColumnDef<AllBillTableProps>[] = [
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    accessorKey: 'todays_payable_amount',
    header: 'Today\'s Payable Amount',
    cell: ({ row }) => (
      <TodaysPayableAmountCell bill={row.original} />
    )
  },
  {
    accessorKey: 'approved_amount',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Approved Amount
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
    cell: ({ row }) => {
      return <div className="text-base font-semibold">{formatRupees(row.original.approved_amount)}</div>
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
    header: 'Status',
    size: 150,
    cell: ({ row }) => <BillStatusBadge bill={row.original} />,
  },
  {
    header: 'Action',
    size: 150,
    cell: ({ row }) => row.original.batches.batch_status === 'unpaid' ? <BatchBillCellAction row={row} /> : null,
  },
  {
    header: 'Paid Status',
    cell: ({ row }) => <PaidBadge row={row.original} />
  },
  {
    id: 'bill',
    header: 'Bill',
    cell: ({ row }) => row.original.connections.paytype === 1 ? <ViewBillButton billId={row.original.id} /> : null
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
    header: 'Recharge Date',
    cell: ({ row }) => ddmmyy(row.original.recharge_date)
  },
  {
    header: 'Recharge Status',
    cell: ({ row }) => <StatusBadge status={row.original.recharge_status} />
  },
  {
    header: 'Action',
    cell: ({ row }) => <RemoveRechargeFromBatchButton row={row} />
  }
];
