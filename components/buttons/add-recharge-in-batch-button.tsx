'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { createClient } from '@/lib/supabase/client';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { Archive } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import IconButtonHover from './icon-button-hover';
import { useToast } from '../ui/use-toast';
import { useUser } from '@/hooks/useUser';

export const AddRechargeInBatchButton = ({
  row
}: {
  row: { original: PrepaidRechargeTableProps };
}) => {

  const user = useUser()
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition();
  const params = useParams();
  const batchId = params.id as string;
  const [open, setOpen] = useState(false);

  const addRechargeFromBatch = async ({
    rechargeId,
    batchId,
    rechargeAmount,
    rechargeDate
  }: {
    rechargeId: string;
    batchId: string;
    rechargeAmount: number | null
    rechargeDate: string | null
  }) => {
    const { data: batch } = await supabase
      .from('batches')
      .select('*')
      .eq('batch_id', batchId)
      .single();

    if (!batch) {
      toast({
        title: 'Error',
        description: 'Batch not found',
        variant: 'destructive'
      });
    }
    if (rechargeDate && new Date(rechargeDate) <= new Date()) {
      const { error: updateError } = await supabase
        .from('batches')
        .update({ validate_at: new Date().toISOString(), updated_by: user?.id || null })
        .eq('batch_id', batchId);

      if (updateError) {
        toast({
          title: 'Error',
          description: 'Failed to update batch validation date',
          variant: 'destructive'
        });
      }
    } else if (batch.validate_at && rechargeDate && new Date(rechargeDate) <= new Date(batch.validate_at)) {
      const { error: updateError } = await supabase
        .from('batches')
        .update({ validate_at: new Date(rechargeDate).toISOString(), updated_by: user?.id || null })
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
      .from('prepaid_recharge')
      .update({ batch_id: batchId, recharge_status: 'batch', recharge_amount: rechargeAmount, updated_by: user?.id || null })
      .eq('id', rechargeId)
      .select();

    toast({
      title: 'Success',
      description: `Recharge added successfully to batch ${batchId}`,
      variant: 'success'
    })
    router.refresh();
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add recharge to batch',
        variant: 'destructive'
      });
      return;
    }
  };

  if (batchId) {
    return (
      <>
        <AlertModal
          title={`Do you want to add the recharge to batch ${batchId}?`}
          isOpen={open}
          onClose={() => setOpen(false)}
          onConfirm={() => {
            startTransition(() => {
              addRechargeFromBatch({ rechargeId: row.original.id, batchId: batchId, rechargeAmount: row.original.recharge_amount || 0, rechargeDate: row.original.recharge_date || null });
            });
            setOpen(false);
          }}
          loading={isPending}
        />
        <IconButtonHover
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          icon={Archive} text={'Add this recharge to the batch.'}>
        </IconButtonHover >

      </>
    );
  }
  return null;
};
