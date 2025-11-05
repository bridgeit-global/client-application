'use client';
import { Switch } from '@/components/ui/switch';
import { useTransition } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { AllBillTableProps } from '@/types/bills-type';

interface CellActionProps {
  data: AllBillTableProps;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {

  const supabase = createClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const togglePaymentStatus = async (id: string, checked: boolean) => {
    const { error } = await supabase
      .from('bills')
      .update({ payment_status: checked })
      .eq('id', id)
      .select();
    if (error) {
      console.error(error);
      return;
    }
  };
  return (
    <Switch
      checked={data.payment_status}
      onCheckedChange={(checked) => {
        startTransition(() => {
          togglePaymentStatus(data.id, checked);
          router.refresh();
          toast({
            variant: 'success',
            title: 'Success',
            description: `Successfully ${checked ? 'Paid' : 'Unpaid'
              } `
          });
        });
      }}
      disabled={isPending || data.payment_status === true}
    />
  );
};
