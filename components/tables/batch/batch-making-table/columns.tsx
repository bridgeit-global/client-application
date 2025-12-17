'use client';
import { ColumnDef } from '@tanstack/react-table';
import { getAdjustedAmountForFailedBills } from '@/lib/utils';
import { formatRupees } from '@/lib/utils/number-format';
import { CartColumnActions, CartHeaderActions } from '@/components/cart-action';
import { AllBillTableProps } from '@/types/bills-type';
import PayTypeBadge from '@/components/badges/pay-type-badge';
import { LowBalanceBadge } from '@/components/badges/low-balance-badge';
import DocumentViewerModalWithPresigned from '@/components/modal/document-viewer-modal-with-presigned';
import { DueDateCell } from '@/components/table-cells/due-date-cell';
import { useSiteName } from '@/lib/utils/site';
import { SubmeterCartHeaderActions, SubmeterCartColumnActions } from '@/components/submeter-cart-action';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
export const postpaidColumns: ColumnDef<AllBillTableProps>[] = [
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
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },

  {
    header: 'Pay Type',
    cell: ({ row }) => <PayTypeBadge paytype={row.original.connections.paytype} />
  },

  {
    accessorKey: 'due_date',
    header: 'Due Date',
    cell: ({ row }) => <DueDateCell discount_date_str={row.original.discount_date} due_date_str={row.original.due_date} is_active={row.original.is_active} />
  },
  {
    header: 'Before Due Amount',
    cell: ({ row }) => row.original.connections.paytype !== 0 && formatRupees(getAdjustedAmountForFailedBills(row.original))
  },
  {
    header: 'After Due Amount',
    cell: ({ row }) => row.original.connections.paytype !== 0 && formatRupees(row.original.bill_amount)
  },
  {
    header: 'Balance',
    cell: ({ row }) => <LowBalanceBadge row={row} />
  },
  {
    header: 'Bill Copy',
    cell: ({ row }) => {
      const content = row.original.content;
      if (content) {
        const content_type = row.original.content_type;
        return (
          <DocumentViewerModalWithPresigned
            contentType={content_type}
            fileKey={content}
          />
        );
      }
    }
  },
];


export const submeterColumns: ColumnDef<AllBillTableProps>[] = [
  {
    id: 'select',
    header: ({ table }) => <SubmeterCartHeaderActions table={table} />,
    cell: ({ row }) => <SubmeterCartColumnActions row={row} />,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 20
  },
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    header: 'Pay Type',
    cell: ({ row }) => <PayTypeBadge paytype={row.original.connections.paytype} />
  },
  {
    accessorKey: 'due_date',
    header: 'Due Date',
    cell: ({ row }) => <DueDateCell discount_date_str={row.original.discount_date} due_date_str={row.original.due_date} is_active={row.original.is_active} />
  },
  {
    header: 'Before Due Amount',
    cell: ({ row }) => row.original.connections.paytype !== 0 && formatRupees(getAdjustedAmountForFailedBills(row.original))
  },
  {
    header: 'After Due Amount',
    cell: ({ row }) => row.original.connections.paytype !== 0 && formatRupees(row.original.bill_amount)
  },
  {
    header: 'Balance',
    cell: ({ row }) => <LowBalanceBadge row={row} />
  },
];

export const prepaidColumns: ColumnDef<AllBillTableProps>[] = [
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    header: 'Pay Type',
    cell: ({ row }) => <PayTypeBadge paytype={row.original.connections.paytype} />
  },
  {
    accessorKey: 'due_date',
    header: 'Due Date',
    cell: ({ row }) => <DueDateCell discount_date_str={row.original.discount_date} due_date_str={row.original.due_date} is_active={row.original.is_active} />
  },
  {
    header: 'Before Due Amount',
    cell: ({ row }) => row.original.connections.paytype !== 0 && formatRupees(getAdjustedAmountForFailedBills(row.original))
  },
  {
    header: 'After Due Amount',
    cell: ({ row }) => row.original.connections.paytype !== 0 && formatRupees(row.original.bill_amount)
  },
  {
    header: 'Balance',
    cell: ({ row }) => <LowBalanceBadge row={row} />
  },
  {
    header: 'Bill Copy',
    cell: ({ row }) => {
      const content = row.original.content;
      if (content) {
        const content_type = row.original.content_type;
        return (
          <DocumentViewerModalWithPresigned
            contentType={content_type}
            fileKey={content}
          />
        );
      }
    }
  },
];