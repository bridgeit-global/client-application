'use client';
import { formatRupees } from '@/lib/utils/number-format';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { ddmmyy } from '@/lib/utils/date-format';
import { ClientPaymentsProps } from '@/types/payments-type';
import { ArrowDownRight, Check, X } from 'lucide-react';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
import ClientPaymentApprovalStatus from '@/components/badges/client-payment-approval-status';
import { Button } from '@/components/ui/button';
import { useIncreaseAmountModalStore } from '@/lib/store/increase-amount-modal-store';
import { useSiteName } from '@/lib/utils/site';
import { RemoveBillFromBatchButton } from '@/components/buttons/remove-bill-from-batch-button';
import { RemoveRechargeFromBatchButton } from '@/components/buttons/remove-recharge-from-batch-button';
import DocumentViewerModalWithPresigned from '@/components/modal/document-viewer-modal-with-presigned';
import ReceiptIndianRupee from '@/components/icons/receipt-indian-rupee';
import { useTransition } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/user-store';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const ApprovalRejectionActions = ({ row }: { row: { original: ClientPaymentsProps } }) => {
  const { user } = useUserStore();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleApprove = async () => {
    try {
      const supabase = createClient();
      const { bills } = row.original;
      
      if (bills && row.original.bill_amount) {
        // Update bill approved amount
        const { error: billError } = await supabase
          .from('bills')
          .update({
            approved_amount: row.original.bill_amount,
          })
          .eq('id', bills.id);

        if (billError) {
          throw new Error(billError.message || 'Failed to approve payment.');
        }

        // Update client payment approval status
        const { error: paymentError } = await supabase
          .from('client_payments')
          .update({
            approval_status: 'approved',
            updated_by: user?.id,
          })
          .eq('bill_id', bills.id)
          .eq('id', row.original.id);

        if (paymentError) {
          throw new Error(paymentError.message || 'Failed to approve payment.');
        }

        toast({
          title: 'Success',
          description: 'Payment approved successfully.',
          variant: 'success',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve payment.',
        variant: 'destructive',
      });
    } finally {
      router.refresh();
    }
  };

  const handleReject = async () => {
    try {
      const supabase = createClient();
      const { bills } = row.original;

      if (bills) {
        // Update bill - reset approved amount and batch
        const { error: billError } = await supabase
          .from('bills')
          .update({
            approved_amount: null,
            batch_id: null,
            bill_status: 'new',
          })
          .eq('id', bills.id);

        if (billError) {
          throw new Error(billError.message || 'Failed to reject payment.');
        }

        // Update client payment approval status
        const { error: paymentError } = await supabase
          .from('client_payments')
          .update({
            approval_status: 'rejected',
            updated_by: user?.id,
          })
          .eq('bill_id', bills.id)
          .eq('id', row.original.id);

        if (paymentError) {
          throw new Error(paymentError.message || 'Failed to reject payment.');
        }

        toast({
          title: 'Rejected',
          description: 'Payment has been rejected.',
          variant: 'success',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject payment.',
        variant: 'destructive',
      });
    } finally {
      router.refresh();
    }
  };

  const billAmount = row.original.bill_amount ?? 0;
  const clientPaidAmount = (Number(row.original.client_paid_amount) || 0) || (Number(row.original.bills?.approved_amount) || 0);
  const diff = billAmount - clientPaidAmount;
  const percent = clientPaidAmount > 0 ? (diff / clientPaidAmount) * 100 : 0;

  return (
    <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap" style={{ maxWidth: '150px' }}>
      <span className="text-sm font-medium truncate">
        {formatRupees(diff)} ({percent.toFixed(1)}%)
      </span>
      <div className="flex gap-1 flex-shrink-0">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="default"
              disabled={isPending}
              className="h-7 px-2"
            >
              <Check className="w-3 h-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-semibold">Confirm Approval</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2 pt-2">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to approve this payment increase?
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                  <span className="text-sm font-medium text-muted-foreground">Amount:</span>
                  <span className="text-base font-semibold text-foreground">
                    {formatRupees(diff)} ({percent.toFixed(1)}%)
                  </span>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end align-middle gap-2 sm:gap-2">
              <AlertDialogCancel disabled={isPending} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => startTransition(handleApprove)}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {isPending ? 'Approving…' : 'Yes, Approve'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              className="h-7 px-2"
            >
              <X className="w-3 h-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-semibold">Confirm Rejection</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2 pt-2">
                <p className="text-sm text-muted-foreground">
                  Rejecting this payment increase will remove this bill from the batch!
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                  <span className="text-sm font-medium text-muted-foreground">Amount:</span>
                  <span className="text-base font-semibold text-foreground">
                    {formatRupees(diff)} ({percent.toFixed(1)}%)
                  </span>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end items-center gap-2 sm:gap-2">
              <AlertDialogCancel disabled={isPending} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => startTransition(handleReject)}
                disabled={isPending}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
              >
                {isPending ? 'Rejecting…' : 'Yes, Reject'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export const columns: ColumnDef<ClientPaymentsProps>[] = [
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => {
      const rowData = row.original.bills;
      const recharge = row.original.prepaid_recharge;
      return row.original.bills ? <SiteAccountBoardCell row={{ original: rowData }} /> : recharge ? <SiteAccountBoardCell row={{ original: recharge }} /> : <div>No Bill</div>
    }
  },
  { accessorKey: 'bill_amount', header: 'Amount', cell: ({ row }) => formatRupees(row.original.bill_amount) },
  {
    accessorKey: 'approved_amount',
    header: 'Approved Amount',
    cell: ({ row }) => {
      const bills = row.original.bills;
      const recharge = row.original.prepaid_recharge;
      return bills ? formatRupees(bills.approved_amount) : recharge ? formatRupees(recharge.recharge_amount) : <div>No Bill</div>
    }
  },
  {
    header: 'Status',
    cell: ({ row }) => {

      if (row.original.status === 'failed') {
        return <div className="flex items-center gap-2">
          <Badge variant="destructive" className="flex items-center gap-2">
            Failed
          </Badge>
          {row.original.bills && row.original.batches.batch_status === 'processing' && <RemoveBillFromBatchButton row={{ original: row.original.bills }} />}
          {row.original.prepaid_recharge && row.original.batches.batch_status === 'processing' && <RemoveRechargeFromBatchButton row={{ original: row.original.prepaid_recharge }} />}
        </div>
      }
      const { setIsModalOpen } = useIncreaseAmountModalStore();
      if (row.original.approval_status === 'pending') {
        if (row.original.client_paid_amount && row.original.bill_amount) {
          const { bill_amount, client_paid_amount } = row.original;
          if (
            typeof bill_amount === 'number' &&
            typeof client_paid_amount === 'number' &&
            bill_amount < client_paid_amount
          ) {
            return (
              <Badge variant="success" className="flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4" />Refund: {formatRupees(client_paid_amount - bill_amount)}
              </Badge>
            );
          }
        }

        if (row.original.bill_amount) {
          const clientPaidAmount = (Number(row.original.client_paid_amount) || 0) || (Number(row.original.bills.approved_amount) || 0);
          const diff = row.original.bill_amount - clientPaidAmount;
          const percent = clientPaidAmount > 0 ? (diff / clientPaidAmount) * 100 : 0;
          if (diff > 0) {
            return <ApprovalRejectionActions row={row} />;
          } else {
            return <Badge variant="success" className="flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4" />{formatRupees(diff)}
            </Badge>
          }
        }
      }
      return <ClientPaymentApprovalStatus approval_status={row.original.approval_status} />
    }
  },
  {
    accessorKey: 'paid_amount',
    header: 'Payment',
    cell: ({ row }) => {
      const billerPaymentTransactions = row.original.bills?.biller_payment_transactions;
      const rechargePaymentTransactions = row.original.prepaid_recharge?.biller_payment_transactions;

      const transactions = billerPaymentTransactions || rechargePaymentTransactions;

      if (!transactions || row.original.status === 'failed') {
        return <div>No Payment</div>
      }

      const batchCreatedAt = row.original?.batches?.created_at ? new Date(row.original.batches.created_at) : null;
      // const batchUpdatedAt = row.original?.batches?.updated_at ? new Date(row.original.batches.updated_at) : batchCreatedAt;

      const isWithinBatchWindow = (dateStr?: string) => {
        if (!dateStr || !batchCreatedAt) return false;
        const d = new Date(dateStr);
        return d >= batchCreatedAt;
      };

      const hasSuccess = row.original.status === 'paid';
      const hasRefund = row.original.status === 'refund';

      return (
        <div className="flex flex-col gap-1">
          {hasSuccess ? (
            <Badge variant={'success'} className="text-xs">success</Badge>
          ) : hasRefund ? (
            <>
              <Badge variant={'destructive'} className="text-xs">reversed</Badge>
            </>
          ) : (
            <Badge variant={'outline'} className="text-xs">pending</Badge>
          )}
        </div>
      )
    }
  },
  {
    accessorKey: 'client_paid_amount',
    header: 'Settlement',
    cell: ({ row }) => {
      const paidAmount = row.original.client_paid_amount || 0;
      const paidDate = row.original.client_paid_date || '';
      const refId = row.original.ref_id;
      return paidAmount > 0 && (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-green-700">{formatRupees(paidAmount)}</span>
          <span className="flex flex-col text-xs text-gray-500 mt-1">
            <span className="font-mono bg-gray-100 px-1 rounded mb-0.5">{refId}</span>
            {paidDate && (
              <span>{ddmmyy(paidDate)}</span>
            )}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'refund_payment_transactions',
    header: 'Refund',
    cell: ({ row }) => {
      const refundBills = row.original.bills?.refund_payment_transactions;
      const refundRecharge = row.original.prepaid_recharge?.refund_payment_transactions;
      if (refundBills) {
        return <div className="flex flex-col gap-1">
          {refundBills?.map((refund) => {
            return <div key={refund.id} className="flex flex-col gap-1">
              <span className="font-semibold text-green-700">{formatRupees(refund.amount)}</span>
              <span className="flex flex-col text-xs text-gray-500 mt-1">
                <span className="font-mono bg-gray-100 px-1 rounded mb-0.5">{refund.reference_id}</span>
                {refund.date && (
                  <span>{ddmmyy(refund.date)}</span>
                )}
              </span>
            </div>
          })}
        </div>
      }
      if (refundRecharge) {
        return <div className="flex flex-col gap-1">
          {refundRecharge?.map((refund) => {
            return <div key={refund.id} className="flex flex-col gap-1">
              <span className="font-semibold text-green-700">{formatRupees(refund.amount)}</span>
              <span className="flex flex-col text-xs text-gray-500 mt-1">
                <span className="font-mono bg-gray-100 px-1 rounded mb-0.5">{refund.reference_id}</span>
                {refund.date && (
                  <span>{ddmmyy(refund.date)}</span>
                )}
              </span>
            </div>
          })}
        </div>
      }
      return <div>No Refund</div>
    }
  },
  {
    header: 'Receipt',
    cell: ({ row }) => {
      const paymentTransactions = row.original?.bills?.biller_payment_transactions || [];
      const rechargePaymentTransactions = row.original?.prepaid_recharge?.biller_payment_transactions || [];
      if (row.original.status !== 'paid' || (paymentTransactions.length === 0 && rechargePaymentTransactions.length === 0)) {
        return <div>No Receipt</div>;
      }
      const transactions = paymentTransactions.concat(rechargePaymentTransactions);
      return (
        <div className="flex gap-1">
          {transactions.map((transaction, index) => {
            if (!transaction.receipt_url) return null;
            const receiptUrl = transaction.receipt_url;
            const isPDF = receiptUrl.endsWith('.pdf');
            const isHTML = receiptUrl.endsWith('.html');
            if (isPDF || isHTML) {
              return (
                <DocumentViewerModalWithPresigned
                  key={index}
                  icon={<ReceiptIndianRupee />}
                  contentType={isPDF ? "pdf" : "html"}
                  fileKey={receiptUrl}
                />
              );
            }
            return null;
          })}
        </div>
      );
    }
  }
];
