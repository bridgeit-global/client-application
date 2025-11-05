import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import { Filter, FilterX } from 'lucide-react';
import IconButton from '@/components/buttons/icon-button';
import { BillerBoardSelector } from '@/components/input/biller-board-selector';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StationTypeSelector } from '@/components/input/station-type-selector';
import { useBatchCartStore } from '@/lib/store/batch-cart-store';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { useSiteName } from '@/lib/utils/site';
type Props = {
  filterBody: any;
  setFilterBody: any;
  handleApplyFilters: any;
  handleClearFilter: any;
};

export default function FilterAction({
  filterBody,
  setFilterBody,
  handleApplyFilters,
  handleClearFilter
}: Props) {
  const site_name = useSiteName();
  // get user station type
  const supabase = createClient();
  const getUser = async () => {
    if (filterBody.type) {
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.station_type) {
      setFilterBody({ ...filterBody, type: user?.user_metadata?.station_type } as any);
    }
  }
  useEffect(() => {
    getUser();
  }, []);
  const onChangeHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterBody((prev: any) => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const onChangeSelectHandle = (key: string, value: string | string[]) => {
    setFilterBody((prev: any) => ({
      ...prev,
      [key]: Array.isArray(value) ? value.join(',') : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleApplyFilters();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <IconButton variant="outline" icon={Filter} text="Filter" />
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px]" side="right">
        <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
          <div className="grid gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="site_id">{site_name} ID</Label>
                <Input
                  id="site_id"
                  value={filterBody.site_id}
                  onChange={onChangeHandle}
                  placeholder={`Enter ${site_name} ID`}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={filterBody.account_number}
                  onChange={onChangeHandle}
                  placeholder="Enter Account Number"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <BillerBoardSelector
                onChange={(value) => onChangeSelectHandle('biller_id', value)}
              />
            </div>
            {/* station type */}
            <div className="space-y-1.5">
              <Label htmlFor="station_type">{site_name} Type</Label>
              <StationTypeSelector
                value={Array.isArray(filterBody?.type) ? filterBody.type : filterBody?.type?.split(',') || []}
                onChange={(types) => onChangeSelectHandle("type", types)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recharge_date_start">Recharge Date Range</Label>
              <div className="flex space-x-2">
                <Input
                  id="recharge_date_start"
                  type="date"
                  value={filterBody.recharge_date_start}
                  onChange={onChangeHandle}
                />
                <Input
                  id="recharge_date_end"
                  type="date"
                  value={filterBody.recharge_date_end}
                  onChange={onChangeHandle}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <SheetClose asChild>
              <Button type="submit" className="w-full">
                Find
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button
                type="button"
                className="w-full text-black"
                variant="link"
                onClick={handleClearFilter}
              >
                Clear <FilterX className="ml-2 h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}


export const ApprovedBillActionButton = ({ table }: any) => {
  const { removeItem } = useBatchCartStore();
  const { toast } = useToast();
  const router = useRouter();
  const data = table
    .getFilteredSelectedRowModel()
    .rows.map((e: any) => e.original);
  const supabase = createClient();
  const unApprove = async () => {
    const { error } = await supabase
      .from('prepaid_recharge')
      .update({ is_deleted: true, recharge_status: "rejected", is_active: false })
      .in('id', data.map((e: any) => e.id))

    data.forEach((e: any) => {
      removeItem(e.id);
    });

    toast({
      variant: 'success',
      title: 'Success',
      description: `Bills Un-approved successfully`
    });
    if (error) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: `Error Un-approving Bills`
      });
    }
    router.refresh();
    table?.resetRowSelection();
  };
  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => unApprove()}>Un-approve</Button>
    </div>
  );
};
