'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getAfterDueAmount } from '@/lib/utils';
import { getLatestBill } from '@/lib/utils/bill';
import { formatRupees } from '@/lib/utils/number-format';
import { createClient } from '@/lib/supabase/client';
import { NewBillFoundModal } from '@/components/modal/new-bill-found-modal';
import IconButton from '@/components/buttons/icon-button';
import { RemoveBillFromBatchButton } from '@/components/buttons/remove-bill-from-batch-button';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from '@/components/ui/alert-dialog';
import { AllBillTableProps } from '@/types/bills-type';
import { useUtilizeAndThresholdAmount } from '@/hooks/use-utilize-amount';
import { useUserStore } from '@/lib/store/user-store';

interface ActionCellProps {
  row: { original: AllBillTableProps };
}

export const BatchBillCellAction: React.FC<ActionCellProps> = ({ row }) => {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const { utilizeAmount, thresholdAmount } = useUtilizeAndThresholdAmount();

  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Action for approving increased amount
  const isActionRequired = row.original.payment_status === false && row.original.is_active === false;
  const isAmountIncreased = row.original.approved_amount && getAfterDueAmount(row.original) > row.original.approved_amount;
  const dueDate = new Date(row.original.due_date);
  const latestBill = getLatestBill(row.original.connections.bills);
  const latestBillAmount = latestBill ? getAfterDueAmount(latestBill) : 0;
  const increasedAmount = latestBillAmount - (row.original.approved_amount || 0);
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const handleApproveAmount = async () => {
    setIsLoading(true);
    try {
      if (thresholdAmount > 0) {
        const allowed_amount = (utilizeAmount || 0) + getAfterDueAmount(row.original);
        if (allowed_amount > thresholdAmount) {
          toast({
            title: 'Error',
            description: `The total approved amount (${formatRupees(allowed_amount)}) exceeds your available threshold limit of ${formatRupees(thresholdAmount)}. Please contact your administrator to increase the threshold.`,
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('bills')
        .update({ approved_amount: getAfterDueAmount(row.original) })
        .eq('id', row.original.id);
      toast({
        title: 'Success',
        description: 'Approved amount updated successfully.',
        variant: 'success',
      });
      router.refresh();
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update approved amount.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsConfirmOpen(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Action Buttons */}
      {row.original.payment_status === false && dueDate < today && isAmountIncreased && (
        (() => {
          const previousAmount = row.original.approved_amount || 0;
          const latestAmount = getAfterDueAmount(row.original);
          const increasedAmount = latestAmount - previousAmount;
          return (
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
              <AlertDialogTrigger asChild>
                <IconButton
                  variant={'ghost'}
                  size={'sm'}
                  icon={Check}
                  onClick={() => setIsConfirmOpen(true)}
                  name="Approve Increased Amount"
                />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve Increased Amount?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to approve the increased bill amount? This action cannot be undone.
                    <div style={{
                      marginTop: 16,
                      padding: 12,
                      background: '#f9fafb',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 15,
                      lineHeight: 1.6
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: '#6b7280' }}>Previous Approved Amount</span>
                        <span style={{ fontWeight: 500 }}>{formatRupees(previousAmount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: '#b91c1c', fontWeight: 600 }}>Increased Amount</span>
                        <span style={{ color: '#b91c1c', fontWeight: 700 }}>{formatRupees(increasedAmount)}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <span style={{ color: '#6b7280' }}>Latest Bill Amount</span>
                        <span style={{ fontWeight: 500 }}>{formatRupees(latestAmount)}</span>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleApproveAmount}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Approve
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          );
        })()
      )}
      {isActionRequired && increasedAmount > 0 && (
        <div>
          <NewBillFoundModal
            batchId={row.original.batch_id}
            oldBillProp={row.original}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            id={row.original.id}
            connectionId={row.original.connections.id}
          />
          <IconButton
            variant={'ghost'}
            size={'sm'}
            icon={Check}
            onClick={() => setIsOpen(true)}
            name="Approve New Bill"
          />
        </div>
      )}
      <RemoveBillFromBatchButton row={row} />
    </div>
  );
};
