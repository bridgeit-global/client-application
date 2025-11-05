'use client';
import { ColumnDef } from '@tanstack/react-table';
import { formatRupees } from '@/lib/utils/number-format';
import { AllBillTableProps } from '@/types/bills-type';
import { AddBillInBatchButton } from '@/components/buttons/add-bill-in-batch-button';
import { DueDateCell } from '@/components/table-cells/due-date-cell';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { ddmmyy } from '@/lib/utils/date-format';
import { AddRechargeInBatchButton } from '@/components/buttons/add-recharge-in-batch-button';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
import TodaysPayableAmountCell from '@/components/table-cells/todays-payable-amount-cell';
import ViewBillButton from '@/components/buttons/view-bill-button';
import { useSiteName } from '@/lib/utils/site';
import { BatchTableProps } from '@/types/batches-type';



export const getColumns = (batch: BatchTableProps | undefined) => {
  const postpaidColumns: ColumnDef<AllBillTableProps>[] = [
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
      header: 'Approved Amount',
      cell: ({ row }) => <div className="text-base font-semibold">{formatRupees(row.original.approved_amount)}</div>
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => <DueDateCell discount_date_str={row.original.discount_date} due_date_str={row.original.due_date} />
    },
    {
      id: 'bill',
      header: 'Bill',
      cell: ({ row }) => <ViewBillButton billId={row.original.id} />
    },
    {
      header: 'Add Bill',
      cell: ({ row }) => <AddBillInBatchButton row={row} batch_status={batch?.batch_status || 'unpaid'} />
    },
  ];

  return postpaidColumns;
}

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
    header: 'Add Recharge',
    cell: ({ row }) => <AddRechargeInBatchButton row={row} />
  },
];
