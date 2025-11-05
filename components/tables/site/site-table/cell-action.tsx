'use client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useState, useTransition } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Pencil } from 'lucide-react';
import { AlertModal } from '@/components/modal/alert-modal';
import { useRouter } from 'next/navigation';
import { SiteConnectionTableProps } from '@/types/site-type';
import { useSiteName } from '@/lib/utils/site';
interface CellActionProps {
  data: SiteConnectionTableProps;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const site_name = useSiteName();
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const handleStatusUpdate = async (isActive: boolean): Promise<boolean> => {
    try {
      const { error: siteError, data: siteData } = await supabase
        .from('sites')
        .update({ is_active: isActive })
        .eq('id', data.id)
        .select();

      if (siteError) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to ${isActive ? 'activate' : 'deactivate'} ${site_name}. ${siteError.message}`
        });
        return false;
      }

      if (!siteData || siteData.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to ${isActive ? 'activate' : 'deactivate'} ${site_name}. No data updated.`
        });
        return false;
      }

      if (!isActive) {
        const { error: connectionError } = await supabase
          .from('connections')
          .update({ is_active: false })
          .eq('site_id', data.id);

        if (connectionError) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: `Failed to deactivate associated connections. ${connectionError.message}`
          });
          return false;
        }
      }

      toast({
        variant: 'success',
        title: 'Success',
        description: `${site_name} has been successfully ${isActive ? 'activated' : 'deactivated'}`
      });
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `An unexpected error occurred while ${isActive ? 'activating' : 'deactivating'} ${site_name}`
      });
      return false;
    }
  };

  return (
    <>
      <AlertModal
        title={`Deactivate ${site_name}`}
        description={`Deactivating this ${site_name} will also deactivate all associated connections. Do you want to proceed?`}
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          startTransition(async () => {
            const success = await handleStatusUpdate(false);
            if (success) {
              setOpen(false);
              router.refresh();
            }
          });
        }}
        loading={isPending}
      />
      <Switch
        checked={data.is_active}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            if (checked) {
              const success = await handleStatusUpdate(true);
              if (success) {
                router.refresh();
              }
            } else {
              setOpen(true);
            }
          });
        }}
        disabled={isPending}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/portal/site-edit?id=${data.id}`)}
        className="h-8 w-8 p-0"
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Edit</span>
      </Button>
    </>
  );
};
