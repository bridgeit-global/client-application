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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultipleSelector, { Option } from '@/components/ui/multiple-selector';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StationTypeSelector } from '@/components/input/station-type-selector';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SURCHARGE_OPTIONS } from '@/constants/surcharge-options';

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
              <Label htmlFor="bill_date_start">Bill Date Range</Label>
              <div className="flex space-x-2">
                <Input
                  id="bill_date_start"
                  type="date"
                  value={filterBody.bill_date_start}
                  onChange={onChangeHandle}
                />
                <Input
                  id="bill_date_end"
                  type="date"
                  value={filterBody.bill_date_end}
                  onChange={onChangeHandle}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bill_date_start">Due Date Range</Label>
              <div className="flex space-x-2">
                <Input
                  id="due_date_start"
                  type="date"
                  value={filterBody.due_date_start}
                  onChange={onChangeHandle}
                />
                <Input
                  id="due_date_end"
                  type="date"
                  value={filterBody.due_date_end}
                  onChange={onChangeHandle}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="is_arrear">Arrear</Label>
                <Select
                  onValueChange={(value) => onChangeSelectHandle('is_arrear', value)}
                  value={filterBody.is_arrear || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Arrear" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Positive</SelectItem>
                    <SelectItem value="false">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="penalty">Penalty</Label>
                <MultipleSelector
                  commandProps={{
                    label: "Select Penalty"
                  }}
                  onChange={(value) => onChangeSelectHandle('penalty', value.map(option => option.value))}
                  defaultOptions={SURCHARGE_OPTIONS}
                  placeholder="Select Penalty"
                  emptyIndicator={<p className="text-center text-sm">No results found</p>}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <SheetClose asChild>
              <Button type="submit" className="w-full">
                Find Bills
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

export const NewBillActionButton = ({ table }: any) => {
  const { toast } = useToast();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const data = table
    .getFilteredSelectedRowModel()
    .rows.map((e: any) => e.original);

  const supabase = createClient();

  const approve = async () => {
    try {

      const { data: { user } } = await supabase.auth.getUser();
      const { error: updateError } = await supabase
        .rpc('update_approved_bills', {
          bill_ids: data.map((e: any) => e.id),
          approver_email: user?.email || '',
        });

      if (updateError) throw updateError;

      toast({
        variant: 'success',
        title: 'Success',
        description: `Bills approved successfully`
      });

      router.refresh();
      table?.resetRowSelection();
    } catch (error: any) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: `Error processing bills: ${error.message}`
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Button onClick={() => setIsDialogOpen(true)}>Approve</Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bill Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {data.length} selected bill{data.length > 1 ? 's' : ''}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={approve}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
