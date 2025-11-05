'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { createClient } from '@/lib/supabase/client';
import { AllBillTableProps } from '@/types/bills-type';
import { Archive } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import IconButtonHover from './icon-button-hover';
import { useToast } from '../ui/use-toast';
import { useUser } from '@/hooks/useUser';
import { BatchTableProps } from '@/types/batches-type';

export const AddBillInBatchButton = ({
  row,
  batch_status = 'unpaid'
}: {
  row: { original: AllBillTableProps };
  batch_status: string;
}) => {

  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition();
  const params = useParams();
  const batchId = params.id as string;
  const [open, setOpen] = useState(false);
  const user = useUser()
  const addBillFromBatch = async ({
    billId,
    batchId,
    billAmount,
    dueDate
  }: {
    billId: string;
    batchId: string;
    billAmount: number;
    dueDate: string;
  }) => {

    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('*')
      .eq('batch_id', batchId)
      .single();


    if (batchError) {
      toast({
        title: 'Error',
        description: `Batch not found`,
        variant: 'destructive'
      })
    }

    // Check if bill is overdue (due date is less than today)
    const today = new Date();
    const billDueDate = new Date(dueDate);
    if (billDueDate <= today) {
      const { error: updateError } = await supabase
        .from('batches')
        .update({ validate_at: today.toISOString(), updated_by: user?.id || null })
        .eq('batch_id', batchId);

      if (updateError) {
        toast({
          title: 'Error',
          description: 'Failed to update batch validation date',
          variant: 'destructive'
        });
        return;
      }
    } else if (batch.validate_at && new Date(dueDate) <= new Date(batch.validate_at)) {
      const { error: updateError } = await supabase
        .from('batches')
        .update({ validate_at: new Date(dueDate).toISOString(), updated_by: user?.id || null })
        .eq('batch_id', batchId);

      if (updateError) {
        toast({
          title: 'Error',
          description: 'Failed to update batch validation date',
          variant: 'destructive'
        });
        return;
      }
    }

    const { error } = await supabase
      .from('bills')
      .update({ batch_id: batchId, bill_status: 'batch', approved_amount: billAmount })
      .eq('id', billId)
      .select();

    toast({
      title: 'Success',
      description: `Bill added successfully to batch ${batchId}`,
      variant: 'success'
    })
    router.refresh();
    if (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to add bill to batch',
        variant: 'destructive'
      });
      return;
    }
  };

  if (batchId) {
    return (
      <>
        <AlertModal
          title={`Do you want to add the bill to batch ${batchId}?`}
          isOpen={open}
          onClose={() => setOpen(false)}
          onConfirm={() => {
            startTransition(() => {
              addBillFromBatch({ billId: row.original.id, batchId: batchId, billAmount: row.original.bill_amount, dueDate: row.original.due_date });
            });
            setOpen(false);
          }}
          loading={isPending}
        />

        {
          batch_status === 'unpaid' ? <IconButtonHover
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            icon={Archive} text={'Add this bill to the batch.'}>
          </IconButtonHover> : null
        }
      </>
    );
  }
  return null;
};
