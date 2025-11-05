'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { createClient } from '@/lib/supabase/client';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import IconButtonHover from './icon-button-hover';
import { useToast } from '../ui/use-toast';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { useUser } from '@/hooks/useUser';

export const RemoveRechargeFromBatchButton = ({
  row
}: {
  row: { original: PrepaidRechargeTableProps };
}) => {

  const user = useUser()
  const { toast } = useToast()
  const supabase = createClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const removeRechargeFromBatch = async ({ rechargeId }: { rechargeId: string }) => {
    const { error } = await supabase
      .from('prepaid_recharge')
      .update({ batch_id: null, recharge_status: 'approved' })
      .eq('id', rechargeId)
      .select();

    const { data: recharge } = await supabase
      .from('prepaid_recharge')
      .select('*,connections!inner(*,paytype,biller_list!inner(*))')
      .eq('batch_id', row.original.batch_id)
      .eq('connections.paytype', 0).eq('connections.is_active', true).eq('connections.is_deleted', false)

    if (recharge?.length === 0) {
      router.replace(`/portal/batch`);
      return;
    }

    const lowestRechargeDate = recharge?.reduce((lowest, current) => {
      if (!lowest || new Date(current.recharge_date) < new Date(lowest.recharge_date)) {
        return current;
      }
      return lowest;
    });

    if (lowestRechargeDate) {
      const { error: updateError } = await supabase
        .from('batches')
        .update({ validate_at: new Date(lowestRechargeDate.recharge_date).toISOString(), updated_by: user?.id || null })
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

    const { count } = await supabase
      .from('prepaid_recharge')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', row.original.batch_id)
    if (count === 0) {
      router.replace(`/portal/prepaid/in-batch`);
    }
    else {
      router.refresh();
    }

  };

  if (row.original.batch_id) {
    return (
      <>
        <AlertModal
          title={`Do you want to remove the recharge from batch ${row.original.batch_id}?`}
          isOpen={open}
          onClose={() => setOpen(false)}
          onConfirm={() => {
            startTransition(() => {
              removeRechargeFromBatch({ rechargeId: row.original.id });
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
          icon={X} text={'Remove this recharge from the batch.'}>
        </IconButtonHover>
      </>
    );
  }
  return null;
};
