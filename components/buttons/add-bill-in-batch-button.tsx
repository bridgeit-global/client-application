'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { AllBillTableProps } from '@/types/bills-type';
import { Archive } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import IconButtonHover from './icon-button-hover';
import { useToast } from '../ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { toLocalDateString } from '@/lib/utils/date-format';

/**
 * Resolve a new validate_at when adding a bill, matching prior button logic.
 * Returns null when the existing batch date should be left alone.
 */
async function resolveValidateAtForBill(
  batchId: string,
  dueDate: string
): Promise<string | null> {
  const supabase = createClient();
  const { data: batch } = await supabase
    .from('batches')
    .select('validate_at')
    .eq('batch_id', batchId)
    .maybeSingle();

  const today = toLocalDateString();
  const dueDay = dueDate.slice(0, 10);

  if (dueDay <= today) {
    return new Date().toISOString();
  }
  if (batch?.validate_at && dueDay <= batch.validate_at.slice(0, 10)) {
    return new Date(dueDate).toISOString();
  }
  return null;
}

export const AddBillInBatchButton = ({
  row,
  batch_status = 'unpaid'
}: {
  row: { original: AllBillTableProps };
  batch_status: string;
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const params = useParams();
  const batchId = params.id as string;
  const [open, setOpen] = useState(false);

  const addBillFromBatch = async () => {
    try {
      const validateAt = await resolveValidateAtForBill(
        batchId,
        row.original.due_date
      );

      // Link via API (items first, then unpaid touch) so Batch Advice fires.
      const response = await fetch('/api/batch/add-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          billIds: [row.original.id],
          ...(validateAt ? { validateAt } : {})
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add bill to batch');
      }

      toast({
        title: 'Success',
        description: `Bill added successfully to batch ${batchId}`,
        variant: 'success'
      });
      router.refresh();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to add bill to batch',
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
        title={`Do you want to add the bill to batch ${batchId}?`}
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          startTransition(() => {
            void addBillFromBatch();
          });
          setOpen(false);
        }}
        loading={isPending}
      />

      {batch_status === 'unpaid' ? (
        <IconButtonHover
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          icon={Archive}
          text={'Add this bill to the batch.'}
        />
      ) : null}
    </>
  );
};
