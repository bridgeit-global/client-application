'use client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useState, useTransition } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { AlertModal } from '@/components/modal/alert-modal';
import { useRouter } from 'next/navigation';
import { ConnectionTableProps } from '@/types/connections-type';
import { useSiteName } from '@/lib/utils/site';
import { useUserStore } from '@/lib/store/user-store';

interface CellActionProps {
  data: ConnectionTableProps;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useUserStore();

  const toggleSiteStatus = async (id: string, checked: boolean): Promise<boolean> => {
    try {
      const { data: updateResp, error } = await supabase
        .from('connections')
        .update({ is_active: checked, updated_by: user?.id })
        .eq('id', id)
        .select();

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to ${checked ? 'activate' : 'deactivate'} connection. ${error.message}`
        });
        return false;
      }

      if (updateResp.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to ${checked ? 'activate' : 'deactivate'} connection. No data updated.`
        });
        return false;
      }

      toast({
        variant: 'success',
        title: 'Success',
        description: `Successfully ${checked ? 'activated' : 'deactivated'} connection`
      });
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `An unexpected error occurred while ${checked ? 'activating' : 'deactivating'} connection`
      });
      return false;
    }
  };

  const toggleSiteDelete = async (id: string): Promise<boolean> => {
    try {
      const { data: updateResp, error } = await supabase
        .from('connections')
        .update({ is_deleted: true, updated_by: user?.id })
        .eq('id', id)
        .select();

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to delete connection. ${error.message}`
        });
        return false;
      }

      if (updateResp.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to delete connection. No data updated.`
        });
        return false;
      }

      toast({
        variant: 'success',
        title: 'Success',
        description: `Successfully deleted connection`
      });
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `An unexpected error occurred while deleting connection`
      });
      return false;
    }
  };
  const deleteSite = async () => {
    startTransition(async () => {
      const success = await toggleSiteDelete(data.id);
      if (success) {
        setOpen(false);
        router.refresh();
      }
    });
  };
  return (
    <>
      <AlertModal
        title={`Do you want connection delete?`}
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={deleteSite}
        loading={isPending}
      />
      <div className="flex items-center gap-2">
        <Switch
          checked={data.is_active}
          onCheckedChange={(checked) => {
            startTransition(async () => {
              const success = await toggleSiteStatus(data.id, checked);
              if (success) {
                router.refresh();
              }
            });
          }}
          disabled={isPending}
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => router.push(`/portal/connection-edit?id=${data.id}`)}
          title="Edit connection"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        
      </div>
    </>
  );
};

export const SiteActionButton = ({ table, fetchData }: any) => {
  const { toast } = useToast();
  const router = useRouter();
  const site_name = useSiteName();
  const { user } = useUserStore();
  const data = table
    .getFilteredSelectedRowModel()
    .rows.map((e: any) => e.original);
  const supabase = createClient();
  const activate = async (is_active = false) => {
    const { data: updateResp, error } = await supabase
      .from('connections')
      .update({ is_active: is_active, updated_by: user?.id })
      .in(
        'id',
        data.map((e: any) => e.id)
      )
      .select();
    toast({
      variant: 'success',
      title: 'Success',
      description: `${site_name} ${is_active ? 'Activated' : 'Deactivated'
        } successfully`
    });
    if (error) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: `Error ${is_active ? 'Activation' : 'Deactivation'
          } ${site_name}`
      });
    }
    router.refresh();
    table?.resetRowSelection();
    fetchData && fetchData();
  };
  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => activate(true)}>Activate</Button>
      <Button onClick={() => activate(false)}>Deactivate</Button>
    </div>
  );
};
