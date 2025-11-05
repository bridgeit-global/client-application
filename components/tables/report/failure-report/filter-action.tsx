import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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
  SelectValue
} from '@/components/ui/select';
import { useSiteName } from '@/lib/utils/site';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
type Props = {
  filterBody: any;
  setFilterBody: any;
  handleApplyFilters?: any;
  handleClearFilter?: any;
  isSummaryView?: boolean;
};

export default function FilterAction({
  filterBody,
  setFilterBody,
  handleApplyFilters,
  handleClearFilter,
  isSummaryView = false
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleApplyFilters();
  };

  const onChangeHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterBody((prev: any) => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };
  const onChangeSelectHandle = (id: string, value: any) => {
    setFilterBody((prev: any) => ({
      ...prev,
      [id]: value
    }));
  };
  return (
    <Sheet>
      <SheetTrigger asChild>
        <IconButton variant={'outline'} icon={Filter} text={'Filter'} />
      </SheetTrigger>
      <SheetContent className="flex flex-1 flex-col overflow-auto" side="right">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Adjust the filters to refine your search results.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-between">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={filterBody.account_number || ''}
                  onChange={onChangeHandle}
                  placeholder="Enter Account Number"
                  disabled={isSummaryView}
                  className={isSummaryView ? "opacity-50 cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Select
                  onValueChange={(value) => onChangeSelectHandle('reason', value)}
                  value={filterBody.reason || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Reasons</SelectItem>
                    <SelectItem value="Service Providers Site Issues">Service Providers Site Issues</SelectItem>
                    <SelectItem value="Bill Not Available">Bill Not Available</SelectItem>
                    <SelectItem value="Invalid Consumer Details">Invalid Consumer Details</SelectItem>
                    <SelectItem value="Invalid PDF Details">Invalid PDF Details</SelectItem>
                    <SelectItem value="Invalid Bill Details">Invalid Bill Details</SelectItem>
                    <SelectItem value="Bill Extraction Issue">Bill Extraction Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <BillerBoardSelector
              defaultValue={filterBody.biller_id ? (Array.isArray(filterBody.biller_id) ? filterBody.biller_id : filterBody.biller_id.split(',')) : []}
              onChange={(value) => {
                onChangeSelectHandle('biller_id', value);
              }}
            />
                         <div className="space-y-2">
               <Label>Failure Type</Label>
               <Select
                 onValueChange={(value) => onChangeSelectHandle('dlq_type', value)}
                 value={filterBody.dlq_type || ''}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Select a Failure Type" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="">All Failure Types</SelectItem>
                   <SelectItem value="registration-dlq">Registration Failure</SelectItem>
                   <SelectItem value="activation-dlq">Bill Download Failure</SelectItem>
                   <SelectItem value="payment-dlq">Payment Failure</SelectItem>
                   <SelectItem value="pdf-dlq">Extraction Failure</SelectItem>
                 </SelectContent>
               </Select>
             </div>

          </div>
          <div className="space-y-1.5">
            <Label htmlFor="billDateStart">Date Range</Label>
            <div className="flex space-x-2">
              <Input
                id="created_at_start"
                type="date"
                value={filterBody.created_at_start}
                onChange={onChangeHandle}
              />
              <Input
                id="created_at_end"
                type="date"
                value={filterBody.created_at_end}
                onChange={onChangeHandle}
              />
            </div>
          </div>
          <div className="flex flex-col items-stretch space-y-2 mt-auto pt-4">
            <SheetClose asChild>
              <Button
                type="submit"
                className="w-full"
              >
                Find Report
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
