'use client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
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
import { MoreHorizontal, Trash } from 'lucide-react';
import { AlertModal } from '@/components/modal/alert-modal';
import { AllBillTableProps } from '@/types/bills-type';
import { useSiteName } from '@/lib/utils/site';
import { useUserStore } from '@/lib/store/user-store';
interface CellActionProps {
  data: AllBillTableProps;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const site_name = useSiteName();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();
  const { user } = useUserStore();

  const toggleConnectionDelete = async (id: string): Promise<boolean> => {
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

      if (!updateResp || updateResp.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete connection. No data updated.'
        });
        return false;
      }

      toast({
        variant: 'success',
        title: 'Success',
        description: 'Successfully deleted connection'
      });
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred while deleting connection'
      });
      return false;
    }
  };
  const toggleConnectionStatus = async (id: string, checked: boolean): Promise<boolean> => {
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

      if (!updateResp || updateResp.length === 0) {
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
  const deleteConnection = async () => {
    startTransition(async () => {
      const success = await toggleConnectionDelete(data.id);
      if (success) {
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <AlertModal
        title="Delete Connection"
        description="Are you sure you want to delete this connection? This action cannot be undone."
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={deleteConnection}
        loading={isPending}
      />
      <Switch
        checked={data.is_active}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            const success = await toggleConnectionStatus(data.id, checked);
            if (success) {
              router.refresh();
            }
          });
        }}
        disabled={isPending}
      />
      {data.is_active == false ? (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setOpen(true)}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </>
  );
};

export const SiteActionButton = ({ table }: any) => {
  const { toast } = useToast();
  const site_name = useSiteName();
  const data = table
    .getFilteredSelectedRowModel()
    .rows.map((e: any) => e.original);
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUserStore();
  const activate = async (is_active = false) => {
    try {
      const { data: updateResp, error } = await supabase
        .from('connections')
        .update({ is_active: is_active, updated_by: user?.id })
        .in(
          'id',
          data.map((e: any) => e.id)
        )
        .select();

      if (error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: `Error ${is_active ? 'activating' : 'deactivating'} connections. ${error.message}`
        });
        return;
      }

      if (!updateResp || updateResp.length === 0) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: `No connections were ${is_active ? 'activated' : 'deactivated'}`
        });
        return;
      }

      toast({
        variant: 'success',
        title: 'Success',
        description: `Successfully ${is_active ? 'activated' : 'deactivated'} ${updateResp.length} connection(s)`
      });

      table?.resetRowSelection();
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: `An unexpected error occurred while ${is_active ? 'activating' : 'deactivating'} connections`
      });
    }
  };
  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => activate(true)}>Activate</Button>
      <Button onClick={() => activate(false)}>Deactivate</Button>
    </div>
  );
};
