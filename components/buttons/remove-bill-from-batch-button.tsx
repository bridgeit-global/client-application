'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { createClient } from '@/lib/supabase/client';
import { AllBillTableProps } from '@/types/bills-type';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import IconButtonHover from './icon-button-hover';
import { useToast } from '../ui/use-toast';
import { getAfterDueAmount } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';

export const RemoveBillFromBatchButton = ({
  row
}: {
  row: { original: AllBillTableProps };
}) => {

  const user = useUser()
  const { toast } = useToast()
  const supabase = createClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const isAmountIncreased = row.original.approved_amount && getAfterDueAmount(row.original) > row.original.approved_amount;

  const removeBillFromBatch = async ({ billId }: { billId: string }) => {
    const { error } = await supabase
      .from('bills')
      .update(isAmountIncreased ? { batch_id: null, bill_status: 'new', approved_amount: null } : { batch_id: null, bill_status: 'approved' })
      .eq('id', billId)
      .select();

    const { data: bill } = await supabase
      .from('bills')
      .select('*,connections!inner(*,paytype,biller_list!inner(*))')
      .eq('batch_id', row.original.batch_id)
      .eq('connections.paytype', 1).eq('connections.is_active', true).eq('connections.is_deleted', false)

    if (bill?.length === 0) {
      router.replace(`/portal/batch`);
      return;
    }

    // Get lowest due date bill from remaining bills in batch

    const lowestDueDateBill = bill?.reduce((lowest, current) => {
      if (!lowest || new Date(current.due_date) < new Date(lowest.due_date)) {
        return current;
      }
      return lowest;
    });

    // Update batch validate_at to lowest due date
    if (lowestDueDateBill) {
      const today = new Date(new Date().toISOString().split('T')[0]);
      const validateAt = new Date(lowestDueDateBill.due_date) < today ? today.toISOString().split('T')[0] : new Date(lowestDueDateBill.due_date).toISOString().split('T')[0];
      const { error: updateError } = await supabase
        .from('batches')
        .update({ validate_at: validateAt, updated_by: user?.id || null })
        .eq('batch_id', row.original.batch_id);

      if (updateError) {
        toast({
          title: 'Error',
          description: 'Failed to update batch validation date',
          variant: 'destructive'
        });
        return;
      }
    }

    toast({
      title: 'Success',
      description: `Bill removed successfully from batch ${row.original.batch_id}`,
      variant: 'success'
    })
    if (error) {
      toast({
        title: 'Error',
        description: `Bill removed failed from batch ${row.original.batch_id}`,
        variant: 'destructive'
      })
    }
    const { count } = await supabase
      .from('bills')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', row.original.batch_id)
    if (count === 0) {
      router.replace(`/portal/batch`);
    }
    else {
      router.refresh();
    }
  };

  if (row.original.batch_id) {
    return (
      <>
        <AlertModal
          title={`Do you want to remove the bill from batch ${row.original.batch_id}?`}
          isOpen={open}
          onClose={() => setOpen(false)}
          onConfirm={() => {
            startTransition(() => {
              removeBillFromBatch({ billId: row.original.id });
              setOpen(false)
            });
          }}
          loading={isPending}
        />
        <IconButtonHover
          variant="ghost"
          size="icon"
          onClick={() => {
            setOpen(true);
          }}
          icon={X} text={'Remove this bill from the batch.'}>
        </IconButtonHover>
      </>
    );
  }
  return null;
};
