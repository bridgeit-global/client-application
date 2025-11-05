'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ddmmyy } from '@/lib/utils/date-format';
import { formatRupees } from '@/lib/utils/number-format';
import { BatchTableProps } from '@/types/batches-type';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientPaymentsProps, PaymentGatewayTransactionsProps } from '@/types/payments-type';
import { filterIncreaseAmountRecords } from '@/lib/utils';
import ViewBatchButton from '@/components/buttons/view-batch-button';
import { UploadBatchReceiptModal } from '@/components/modal/upload-batch-receipt-modal';
import { useEffect, useState } from 'react';
import { useUtilizeAndThresholdAmount } from '@/hooks/use-utilize-amount';
import { snakeToTitle } from '@/lib/utils/string-format';
import { PDFViewer } from '@/components/modal/pdf-viewer-modal';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

export const columns: ColumnDef<BatchTableProps>[] = [
  {
    id: 'select',
    header: ({ table }) => {
      const selectableRows = table.getFilteredRowModel().rows;
      // Only rows with batch_status === 'client_paid' are selectable
      const clientPaidRows = selectableRows.filter(row => row.original.batch_status === 'client_paid' && row.original.payment_gateway_transactions.length === 0);
      const isAllSelectableRowsSelected = clientPaidRows.length > 0 && clientPaidRows.every(row => row.getIsSelected());
      const isSomeSelected = clientPaidRows.some(row => row.getIsSelected());

      return (
        <Checkbox
          checked={isAllSelectableRowsSelected ? true : isSomeSelected ? 'indeterminate' : false}
          onCheckedChange={(value) => {
            clientPaidRows.forEach(row => {
              row.toggleSelected(!!value);
            });
          }}
          aria-label="Select all"
        />
      );
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        disabled={row.original.batch_status !== 'client_paid' || row.original.payment_gateway_transactions.length > 0}
      />
    ),
    enableResizing: false,
    size: 20
  },
  {
    header: 'Batch Id',
    size: 200,
    cell: ({ row }) => {
      const increaseAmountRecords = filterIncreaseAmountRecords(row.original.client_payments);
      return (
        <div className='flex items-center'>
          <ViewBatchButton link={`/portal/batch-payment/${row.original.batch_id}`} batchId={row.original.batch_id} />
          {increaseAmountRecords.length > 0 && <Badge variant={'destructive'} className='ml-2'>{increaseAmountRecords.length}</Badge>}
        </div>
      );
    }
  },
  {
    header: 'No Of Items',
    cell: ({ row }) => {
      const billsCount = row.original.client_payments.filter((payment: ClientPaymentsProps) => payment.bill_id !== null).length;
      const prepaidCount = row.original.client_payments.filter((payment: ClientPaymentsProps) => payment.bill_id === null).length;
      const total = billsCount + prepaidCount;
      const items = [
        { label: 'Bills', count: billsCount },
        { label: 'Recharges', count: prepaidCount }
      ];

      return (
        <div className="text-left flex flex-col gap-1">
          <span className="font-medium">Total: {total}</span>
          {items.map(({ label, count }) => (
            count > 0 && (
              <span key={label}>
                <span className="text-xs text-muted-foreground">
                  {label}: {' '}
                </span>
                <span className="font-semibold">{count}</span>
              </span>
            )
          ))}
        </div>
      );
    }
  },


  {
    header: 'Approved Amount',
    cell: ({ row }) => {
      const bills = row.original.client_payments.filter((payment: ClientPaymentsProps) => payment.bill_id !== null);
      const prepaidRecharge = row.original.client_payments.filter((payment: ClientPaymentsProps) => payment.bill_id === null);
      const billsTotal = bills.reduce((acc, bill) => acc + (bill.approved_amount || 0), 0);
      const rechargeTotal = prepaidRecharge.reduce((acc, recharge) => acc + (recharge.approved_amount || 0), 0);
      const total = billsTotal + rechargeTotal;
      return (
        <div className="text-left flex flex-col gap-1">
          <span className="font-semibold">{formatRupees(total)}</span>
          {bills.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Bills: {formatRupees(billsTotal)}
            </span>
          )}
          {prepaidRecharge.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Recharges: {formatRupees(rechargeTotal)}
            </span>
          )}
        </div>
      );
    }
  },
  {
    header: 'Paid Amount',
    cell: ({ row }) => {
      let clientPayments = row.original.client_payments.filter((payment: ClientPaymentsProps) => payment.status === 'paid');
      return <div className="text-left font-semibold">{formatRupees(clientPayments.reduce((acc, payment) => acc + (payment.paid_amount || 0), 0))}</div>;
    }
  },
  {
    header: 'Refund Amount',
    cell: ({ row }) => {
      return row.original.refund_payment_transactions && <div className="text-left">{formatRupees(row.original.refund_payment_transactions?.reduce((acc, payment) => acc + (payment.amount || 0), 0))}</div>;
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
          Creation Date
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
    cell: ({ row }) => <div>{ddmmyy(row.original.created_at)}</div>,
    accessorKey: 'created_at'
  },
  {
    header: 'Status',
    cell: ({ row }) => {

      if (row.original.batch_status === 'settled') {
        return <Badge variant={'success'} >Settled</Badge>
      }


      if (row.original.batch_status !== 'client_paid' || row.original.payment_gateway_transactions.length > 0) {
        return <Badge variant={'outline'} >Processing</Badge>
      }

      const { thresholdAmount, isLoading: isThresholdLoading } = useUtilizeAndThresholdAmount();
      const [isModalOpen, setIsModalOpen] = useState(false)
      const [isLoading, setIsLoading] = useState(false)
      const router = useRouter();

      if (isThresholdLoading || isLoading) {
        return <Skeleton className="h-8 w-20" />;
      }

      if (thresholdAmount === 0) {
        return <Badge variant={'success'} >Paid</Badge>
      }

      const clientPayments = row.original.client_payments.filter((payment: ClientPaymentsProps) => payment.status === 'paid');
      const amount = clientPayments.reduce((acc, payment) => acc + (payment.paid_amount || 0), 0) || 0

      const payBills = async ({
        batchId,
        transactionReference,
        paymentMode,
        remarks,
        transactionDate,
      }: {
        batchId: string;
        transactionReference: string;
        paymentMode: string;
        remarks: string;
        transactionDate: string;
      }) => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/batch/pay', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              batchId,
              transactionReference,
              paymentMode,
              remarks,
              amount,
              transactionDate,
            }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Failed to process payment');
          router.refresh();
          toast({
            title: 'Success',
            description: 'Payment made successfully',
            variant: 'success',
          });
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.message || 'Failed to process payment',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }

      }
      return <div className='flex items-center gap-2'>
        {row.original.payment_gateway_transactions.length === 0 && amount > 0 && row.original.batch_status === 'client_paid' ? (
          <>
            <UploadBatchReceiptModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              id={row.original.batch_id || ''}
              amount={amount}
              payBills={({ transactionReference, paymentMode, remarks, transactionDate }) => payBills({
                batchId: row.original.batch_id || '',
                transactionReference,
                paymentMode,
                remarks,
                transactionDate: transactionDate || new Date().toISOString().slice(0, 10),
              })}
            />
            <Button size={'sm'} onClick={() => setIsModalOpen(true)} disabled={isLoading}>Pay Now</Button>
          </>
        ) : (
          <Badge variant={'outline'} >Processing</Badge>
        )
        }
      </div>
    },

    accessorKey: 'batch_status'
  },
  // {
  //   header: 'Transaction',
  //   cell: ({ row }) => {
  //     return row.original.payment_gateway_transactions.length > 0 ? (
  //       <div className="flex flex-col gap-2">
  //         {row.original.payment_gateway_transactions.map((transaction: PaymentGatewayTransactionsProps) => (
  //           <Badge
  //             key={transaction.transaction_reference}
  //             variant={
  //               transaction.payment_status === 'approved' ? 'success' :
  //                 transaction.payment_status === 'rejected' ? 'destructive' :
  //                   transaction.payment_status === 'pending' ? 'outline' :
  //                     'outline'
  //             }
  //             className="text-xs"
  //           >
  //             {snakeToTitle(transaction.payment_status || '')}
  //           </Badge>
  //         ))}
  //       </div>
  //     ) : null
  //   }
  // },
  {
    header: 'File',
    cell: ({ row }) => {

      const [isOpen, setIsOpen] = useState(false)
      const [fileUrl, setFileUrl] = useState('')


      const handleOpen = () => {
        setIsOpen(true)
      }

      const handleClose = () => {
        setIsOpen(false)
      }

      const getLatestFile = (files: any[]) => {
        return files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.name || null;
      }
      useEffect(() => {
        const getFileUrl = async () => {
          const supabase = createClient();
          const { data, error } = await supabase.storage.from('batches').list(row.original.batch_id);
          if (error) {
            console.error('Error fetching file:', error);
            return;
          }
          const fileUrl = getLatestFile(data)
          setFileUrl(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/batches/${row.original.batch_id}/${fileUrl}`);
        }

        getFileUrl();
      }, [row.original.batch_status]);




      if (fileUrl) {
        return <div>
          <Button variant={'outline'} size={'sm'} onClick={handleOpen}>View File</Button>
          <Dialog
            open={isOpen}
            onOpenChange={handleClose}
          >
            <DialogContent className="h-full max-h-[95vh] w-full max-w-[95vw] p-2 sm:p-6">
              <PDFViewer pdfUrl={fileUrl} />
            </DialogContent>
          </Dialog>
        </div>
      }

      return <div>No File</div>
    }
  }
];
