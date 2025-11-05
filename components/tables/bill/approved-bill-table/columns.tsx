'use client';
import { ddmmyy } from '@/lib/utils/date-format';
import { formatRupees } from '@/lib/utils/number-format';
import { ColumnDef } from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
} from 'lucide-react';
import { AllBillTableProps } from '@/types/bills-type';
import { Button } from '@/components/ui/button';
import { DueDateCell } from '@/components/table-cells/due-date-cell';
import { CartHeaderActions, CartColumnActions } from '@/components/cart-action';
import React from 'react';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
import TodaysPayableAmountCell from '@/components/table-cells/todays-payable-amount-cell';
import ViewBillButton from '@/components/buttons/view-bill-button';
import { useSiteName } from '@/lib/utils/site';

export const columns: ColumnDef<AllBillTableProps>[] = [
  {
    id: 'select',
    header: ({ table }) => <CartHeaderActions table={table} />,
    cell: ({ row }) => <CartColumnActions row={row} />,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 20
  },
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />,
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
    accessorKey: 'bill_date',
    cell: ({ row }) => row.original.bill_date && ddmmyy(row.original.bill_date),
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Bill Date
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      )
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
    id: 'bill',
    header: 'Bill',
    cell: ({ row }) => row.original.connections.paytype === 1 ? <ViewBillButton billId={row.original.id} /> : null
  },

];



