'use client';
import { ddmmyy } from '@/lib/utils/date-format';
import { formatRupees } from '@/lib/utils/number-format';
import { ColumnDef } from '@tanstack/react-table';
import { AllBillTableProps } from '@/types/bills-type';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DueDateCell } from '@/components/table-cells/due-date-cell';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import PaidBadge from '@/components/badges/paid-badge';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
import TodaysPayableAmountCell from '@/components/table-cells/todays-payable-amount-cell';
import React from 'react';
import { BillStatusBadge } from '@/components/badges/bill-status-badge';
import { BatchBillCellAction } from '@/components/badges/batch-bill-cell-action';
import ViewBillButton from '@/components/buttons/view-bill-button';
import ViewBatchButton from '@/components/buttons/view-batch-button';
import { useSiteName } from '@/lib/utils/site';

export const postpaidColumns: ColumnDef<AllBillTableProps>[] = [

  {
    header: 'Batch ID',
    cell: ({ row }) => <ViewBatchButton link={`/portal/batch/${row.original.batch_id}`} batchId={row.original.batch_id || ''} />
  },
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />,
  },
  {
    accessorKey: 'today_amount',
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
    cell: ({ row }) => row.original.due_date && <DueDateCell discount_date_str={row.original.discount_date} due_date_str={row.original.due_date} />,
    accessorKey: 'due_date'
  },
  {
    header: 'Bill Status',
    cell: ({ row }) => <BillStatusBadge bill={row.original} />
  },
  {
    header: 'Action',
    cell: ({ row }) => row.original.batches.batch_status !== 'processing' ? <BatchBillCellAction row={row} /> : null
  },
  {
    header: 'Paid Status',
    cell: ({ row }) => <PaidBadge row={row.original} />
  },
  {
    id: 'bill',
    header: 'Bill',
    cell: ({ row }) => <ViewBillButton billId={row.original.id} />
  },
];

export const submeterColumns: ColumnDef<AllBillTableProps>[] = [

  {
    header: 'Batch ID',
    cell: ({ row }) => <ViewBatchButton link={`/portal/batch/${row.original.batch_id}`} batchId={row.original.batch_id || ''} />
  },
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />,
  },
  {
    accessorKey: 'today_amount',
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
    cell: ({ row }) => row.original.due_date && <DueDateCell discount_date_str={row.original.discount_date} due_date_str={row.original.due_date} />,
    accessorKey: 'due_date'
  },
  {
    header: 'Bill Status',
    cell: ({ row }) => <BillStatusBadge bill={row.original} />
  },
  {
    header: 'Action',
    cell: ({ row }) => row.original.batches.batch_status !== 'processing' ? <BatchBillCellAction row={row} /> : null
  },
  {
    header: 'Paid Status',
    cell: ({ row }) => <PaidBadge row={row.original} />
  },
];

export const prepaidColumns: ColumnDef<PrepaidRechargeTableProps>[] = [
  {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Batch ID
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
      const router = useRouter();
      const goToBatchBill = () => router.push(`/portal/prepaid/in-batch/${row.original.batch_id}`);
      return (
        <div className="relative flex items-center group">
          <Badge
            className="flex items-center gap-1 hover:bg-primary/40 cursor-pointer"
            variant={'outline'}
            onClick={goToBatchBill}
          >
            {row.original.batch_id}
          </Badge>
        </div>
      );
    },
    accessorKey: 'batch_id'
  },
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
    cell: ({ row }) => row.original.recharge_date && ddmmyy(row.original.recharge_date),
    accessorKey: 'recharge_date'
  },
];

