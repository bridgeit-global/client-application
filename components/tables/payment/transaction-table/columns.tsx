'use client';
import { ColumnDef } from '@tanstack/react-table';
import { PaymentGatewayTransactionsProps } from '@/types/payments-type';
import { CellAction } from './cell-action';
import { formatRupees } from '@/lib/utils/number-format';
import { ddmmyy } from '@/lib/utils/date-format';
import { Badge } from '@/components/ui/badge';
import { snakeToTitle } from '@/lib/utils/string-format';

export const columns: ColumnDef<PaymentGatewayTransactionsProps>[] = [
  {
    accessorKey: 'batch_id',
    header: 'Batch ID',
  },
  {
    accessorKey: 'transaction_reference',
    header: 'Transaction ID',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => formatRupees(row.original.amount),
  },
  {
    accessorKey: 'transaction_date',
    header: 'Transaction Date',
    cell: ({ row }) => ddmmyy(row.original.transaction_date),
  },
  {
    accessorKey: 'payment_method',
    header: 'Payment Method',
  },
  {
    accessorKey: 'payment_status',
    header: 'Payment Status',
    cell: ({ row }) => {
      return <Badge variant={'outline'} >{snakeToTitle(row.original.payment_status || '')}</Badge>
    }
  },
  {
    accessorKey: 'payment_remarks',
    header: 'Payment Remarks',
  },
  {
    accessorKey: 'created_at',
    header: 'Created At',
    cell: ({ row }) => row.original.created_at ? ddmmyy(row.original.created_at) : '',
  },

];
