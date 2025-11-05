'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ClientPaymentsProps } from '@/types/payments-type';
import BatchBillBadge from '@/components/badges/batch-bill-badge';
import { formatRupees } from '@/lib/utils/number-format';
import { ddmmyy } from '@/lib/utils/date-format';
import { PaymentActions } from './payment-actions';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
import ClientPaymentApprovalStatus from '@/components/badges/client-payment-approval-status';
import { useSiteName } from '@/lib/utils/site';
import ViewBatchButton from '@/components/buttons/view-batch-button';
export const columns: ColumnDef<ClientPaymentsProps>[] = [
  {
    id: 'actions',
    header: 'Actions',
    size: 250,
    cell: ({ row }) => {
      if (row.original.approval_status === 'approved') {
        return <PaymentActions data={row.original} />
      }
      return <ClientPaymentApprovalStatus approval_status={row.original.approval_status} />
    }
  },
  {
    accessorKey: 'batch_id',
    header: 'Batch ID',
    cell: ({ row }) => {
      return <ViewBatchButton batchId={row.original.batch_id} />
    }
  },
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => {
      const rowData = row.original?.bills || row.original?.prepaid_recharge;
      if (rowData) {
        return <SiteAccountBoardCell row={{ original: rowData }} />
      }
      return <div>No data</div>
    }
  },
  {
    accessorKey: 'bill_amount', header: 'Amount', cell: ({
      row }) => formatRupees(row.original.bill_amount)
  },
  {
    accessorKey: 'client_paid_amount',
    header: 'Client Paid Amount & Date',
    cell: ({ row }) => (
      <div>
        {formatRupees(row.original.client_paid_amount)}
        {row.original.client_paid_date && (
          <div className="text-sm text-gray-500">
            {ddmmyy(row.original.client_paid_date)}
          </div>
        )}
      </div>
    )
  },
  {
    accessorKey: 'paid_amount',
    header: 'Paid Amount & Date & Ref ID',
    cell: ({ row }) => {
      const transactionId = row.original?.bills?.biller_payment_transactions.map((transaction) => transaction.transaction_reference).join(', ');
      return (
        <div>
          {formatRupees(row.original.paid_amount)}
          <div className="text-sm text-gray-500">
            <div>{transactionId}</div>
            <div>{row.original.paid_date && ddmmyy(row.original.paid_date)}</div>
          </div>
        </div>
      )
    }
  },
  { accessorKey: 'remarks', header: 'Remarks' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <BatchBillBadge status={row.original.status} /> },

];
