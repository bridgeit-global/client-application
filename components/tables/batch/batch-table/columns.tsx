'use client';
import { ColumnDef, Row } from '@tanstack/react-table';
import { ddmmyy } from '@/lib/utils/date-format';
import { formatRupees } from '@/lib/utils/number-format';
import { BatchTableProps } from '@/types/batches-type';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import IconButton from '@/components/buttons/icon-button';
import { ArrowDown, ArrowUp, ArrowUpDown, IndianRupeeIcon, RefreshCw } from 'lucide-react';
import { UploadBatchReceiptModal } from '@/components/modal/upload-batch-receipt-modal';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getNewBillCount } from '@/lib/utils/bill';
import { getAfterDueAmount } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertModal } from '@/components/modal/alert-modal';
import ViewBatchButton from '@/components/buttons/view-batch-button';
import { useUserStore } from '@/lib/store/user-store';
import { useUtilizeAndThresholdAmount } from '@/hooks/use-utilize-amount';

type BillPaymentStatusProps = {
  paidCount: number | string;
  totalCount: number | string;
  isAmount: boolean;
}

export function BillPaymentStatus({
  paidCount,
  totalCount,
  isAmount = false
}: BillPaymentStatusProps) {
  const percentage = Math.round((Number(paidCount) / Number(totalCount)) * 100);
  paidCount = isAmount ? formatRupees(paidCount) : paidCount;
  totalCount = isAmount ? formatRupees(totalCount) : totalCount;

  const getStatusColor = (percentage: number) => {
    if (percentage === 100) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">
          {paidCount} / {totalCount}
        </span>
        <span className={`text-sm font-semibold ${getStatusColor(percentage)}`}>
          {percentage}%
        </span>
      </div>
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getStatusColor(percentage).replace('text', 'bg')}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

const BatchActionCell = ({ row }: { row: Row<BatchTableProps> }) => {


  if (row.original.batch_status === 'processing') {
    return <Badge variant="outline">Processing</Badge>
  }

  const allData = row.original.bills || row.original.prepaid_recharge;
  const newBillCount = getNewBillCount(allData, row.original.bills ? 'postpaid' : 'prepaid');
  const isPaidCount = allData.filter((bill: any) => bill.payment_status === true).length;

  // 1. Batch validity check
  const batch = row.original;
  let isBatchExpired = false;
  let batchExpiryDate: Date | null = null;
  if (batch && batch.validate_at) {
    batchExpiryDate = new Date(batch.validate_at);
    isBatchExpired = new Date(new Date().setHours(0, 0, 0, 0)) > batchExpiryDate;
  }

  // 2. Increased amount bills count
  const increasedAmountCount = (allData || []).filter(bill => {
    const dueDate = new Date(bill.due_date);
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    return bill.approved_amount != null &&
      getAfterDueAmount(bill) > bill.approved_amount &&
      bill.payment_status === false &&
      dueDate < today;
  }).length;

  const hasUnresolvedBillsCount = isPaidCount || newBillCount + increasedAmountCount;

  //hooks
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUserStore();
  const { thresholdAmount, utilizeAmount, isLoading: isUtilizeLoading } = useUtilizeAndThresholdAmount();
  const availableAmount = thresholdAmount - utilizeAmount;

  //state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showRenewConfirm, setShowRenewConfirm] = useState(false);
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const [renewLoading, setRenewLoading] = useState(false);

  useEffect(() => {
    const totalBillAmount = row.original?.bills?.filter((bill: any) => bill.payment_status === false).reduce((sum: number, bill: any) => {
      return sum + (bill.approved_amount || 0);
    }, 0);

    const totalRechargeAmount = row.original.prepaid_recharge.reduce((sum: number, recharge: any) => {
      return sum + (recharge.recharge_amount || 0);
    }, 0);
    const totalAmount = totalBillAmount + totalRechargeAmount;
    setTotalAmount(totalAmount);


  }, [row.original.bills, row.original.prepaid_recharge]);

  const isPostpaid = availableAmount >= totalAmount;

  const handleRenew = async () => {
    setRenewLoading(true);
    try {
      const { error } = await supabase
        .from('batches')
        .update({ validate_at: new Date().toISOString(), updated_by: user?.id || null })
        .eq('batch_id', row.original.batch_id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Success',
        description: 'Batch validity renewed successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message
      });
    } finally {
      setRenewLoading(false);
      window.location.reload(); // Reload the page to show the updated batch status
    }
  };

  const handlePay = async ({
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
          batch_status: 'processing',
          transactionDate,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to process payment');
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
      window.location.reload(); // Reload the page to show the updated batch status
    }
  };

  const handleProcess = async () => {
    try {
      const { data, error } = await supabase.rpc('is_approved_amount_within_threshold').select().single();
      const total_approved = ((data as any)?.total_approved ?? 0) as number;
      const threshold = ((data as any)?.threshold ?? 0) as number;
      if (error) {
        throw new Error(error.message);
      }
      const allowed_amount = (total_approved || 0) + totalAmount;
      if (allowed_amount > threshold) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `The total approved amount (${formatRupees(allowed_amount)}) exceeds your organization's batch threshold limit of ${formatRupees(threshold)}. Please contact your administrator to increase the threshold.`
        });
        return;
      }
      setIsLoading(true);
      const { error: batchError } = await supabase.from('batches').update({
        batch_status: 'processing',
        updated_by: user?.id || null
      }).eq('batch_id', row.original.batch_id).select();

      if (batchError) {
        toast({
          title: 'Error',
          description: batchError.message
        });
        return;
      }
      toast({
        title: 'Success',
        description: 'Batch processed successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      window.location.reload(); // Reload the page to show the updated batch status
    }
  };

  return <div className="text-left">
    <div className="relative flex items-center">
      {hasUnresolvedBillsCount > 0 && (
        <span
          className="absolute -top-2 -right-2 z-10 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white shadow-md border border-white"
          aria-label={`Unresolved bills: ${hasUnresolvedBillsCount}`}
          tabIndex={0}
        >
          {hasUnresolvedBillsCount}
        </span>
      )}
      {isBatchExpired ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                className='w-24'
                icon={RefreshCw}
                size='sm'
                text={'Renew'}
                aria-label="Renew Batch Validity"
                onClick={() => setShowRenewConfirm(true)}
                disabled={isLoading || isUtilizeLoading}
              />
            </TooltipTrigger>
            <TooltipContent>Renew batch validity</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                className='w-26'
                icon={IndianRupeeIcon}
                text={'Initiate Payment'}
                size='sm'
                aria-label="Pay Now"
                onClick={() => {
                  if (hasUnresolvedBillsCount > 0) {
                    toast({
                      title: 'Error',
                      description: 'Please resolve the failed bills first'
                    });
                    return;
                  }
                  if (isPostpaid) {
                    setShowPayConfirm(true);
                  } else {
                    setIsModalOpen(true);
                  }
                }}
                disabled={isLoading || hasUnresolvedBillsCount > 0 || isUtilizeLoading}
              />
            </TooltipTrigger>
            <TooltipContent>
              {hasUnresolvedBillsCount > 0 ? 'Resolve failed bills before paying' : isPostpaid ? 'Process all bills in this batch' : 'Pay all bills in this batch'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    <UploadBatchReceiptModal
      description={`Batch amount greater than available limit.`}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      id={row.original.batch_id || ''}
      amount={totalAmount}
      payBills={({ transactionReference, paymentMode, remarks, transactionDate }) => handlePay({
        batchId: row.original.batch_id || '',
        transactionReference,
        paymentMode,
        remarks,
        transactionDate: transactionDate || new Date().toISOString().slice(0, 10),
      })}
    />
    <AlertModal
      isOpen={showRenewConfirm}
      onClose={() => setShowRenewConfirm(false)}
      onConfirm={async () => {
        setRenewLoading(true);
        await handleRenew();
        setRenewLoading(false);
        setShowRenewConfirm(false);
      }}
      loading={renewLoading}
      title="Renew Batch Validity"
      description="Are you sure you want to renew the batch validity?"
    />

    <AlertModal
      isOpen={showPayConfirm}
      onClose={() => setShowPayConfirm(false)}
      onConfirm={async () => {
        setShowPayConfirm(false);
        handleProcess();
      }}
      loading={isLoading}
      title="Process Batch"
      description="Are you sure you want to process the batch?"
    />
  </div>;
}

export const columns: ColumnDef<BatchTableProps>[] = [
  {
    id: 'select',
    header: 'Id',
    size: 200,
    cell: ({ row }) => {
      const link = row.original.batch_status === 'processing' ? `/portal/batch-payment/${row.original.batch_id}` : `/portal/batch/${row.original.batch_id}`;
      return <ViewBatchButton link={link} batchId={row.original.batch_id} />
    }
  },
  {
    header: 'Total Items',
    cell: ({ row }) => {
      const totalItems = row.original?.bills?.length + row.original?.prepaid_recharge?.length;
      return <div className="text-left">{totalItems}</div>;
    }
  },
  {
    header: 'Total Amount',
    cell: ({ row }) => {
      const totalAmount = row.original?.bills?.reduce((acc, bill) => acc + (bill.approved_amount || 0), 0) + row.original?.prepaid_recharge?.reduce((acc, recharge) => acc + (recharge.recharge_amount || 0), 0);
      return <div className="text-left">{formatRupees(totalAmount)}</div>;
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
          Creation Info
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
      const creationDate = ddmmyy(row.original.created_at);
      const firstName = row.original.created_by_user?.first_name;
      const lastName = row.original.created_by_user?.last_name;
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'N/A';

      return (
        <div className="text-left">
          <div className="font-medium">{creationDate}</div>
          <div className="text-sm text-muted-foreground">by {fullName}</div>
        </div>
      );
    },
    accessorKey: 'created_at'
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Update Info
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
      const firstName = row.original.updated_by_user?.first_name;
      const lastName = row.original.updated_by_user?.last_name;
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || '';

      // Only show update details if updated_by is not empty
      if (!fullName) {
        return <div className="text-left"></div>;
      }

      const updateDate = row.original.updated_at ? ddmmyy(row.original.updated_at) : 'N/A';

      return (
        <div className="text-left">
          <div className="font-medium">{updateDate}</div>
          <div className="text-sm text-muted-foreground">by {fullName}</div>
        </div>
      );
    },
    accessorKey: 'updated_at'
  },
  {
    header: "Validity",
    cell: ({ row }) => row.original.validate_at && ddmmyy(row.original.validate_at),
    accessorKey: 'validate_at'
  },
  {
    header: 'Action',
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 300,
    cell: ({ row }) => {
      return (
        <div className="text-left flex items-center gap-2">
          {(row.original.bills.length > 0 || row.original.prepaid_recharge.length > 0) && <BatchActionCell row={row} />}
        </div>
      );
    }
  },
];
