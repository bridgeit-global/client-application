'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { Archive } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import IconButtonHover from './icon-button-hover';
import { useToast } from '../ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { toLocalDateString } from '@/lib/utils/date-format';

/**
 * Resolve a new validate_at when adding a recharge, matching prior button logic.
 * Returns null when the existing batch date should be left alone.
 */
async function resolveValidateAtForRecharge(
  batchId: string,
  rechargeDate: string | null
): Promise<string | null> {
  if (!rechargeDate) return null;

  const supabase = createClient();
  const { data: batch } = await supabase
    .from('batches')
    .select('validate_at')
    .eq('batch_id', batchId)
    .maybeSingle();

  const today = toLocalDateString();
  const rechargeDay = rechargeDate.slice(0, 10);

  if (rechargeDay <= today) {
    return new Date().toISOString();
  }
  if (batch?.validate_at && rechargeDay <= batch.validate_at.slice(0, 10)) {
    return new Date(rechargeDate).toISOString();
  }
  return null;
}

export const AddRechargeInBatchButton = ({
  row
}: {
  row: { original: PrepaidRechargeTableProps };
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const params = useParams();
  const batchId = params.id as string;
  const [open, setOpen] = useState(false);

  const addRechargeFromBatch = async () => {
    try {
      const validateAt = await resolveValidateAtForRecharge(
        batchId,
        row.original.recharge_date || null
      );

      // Link via API (items first, then unpaid touch) so Batch Advice fires.
      // Do not update batches from the client before linking — that races an
      // empty advice and/or skips the post-link webhook touch.
      const response = await fetch('/api/batch/add-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          rechargeIds: [row.original.id],
          ...(validateAt ? { validateAt } : {})
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add recharge to batch');
      }

      toast({
        title: 'Success',
        description: `Recharge added successfully to batch ${batchId}`,
        variant: 'success'
      });
      router.refresh();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to add recharge to batch',
        variant: 'destructive'
      });
    }
  };

  if (!batchId) {
    return null;
  }

  return (
    <>
      <AlertModal
        title={`Do you want to add the recharge to batch ${batchId}?`}
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          startTransition(() => {
            void addRechargeFromBatch();
          });
          setOpen(false);
        }}
        loading={isPending}
      />
      <IconButtonHover
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        icon={Archive}
        text={'Add this recharge to the batch.'}
      />
    </>
  );
};
