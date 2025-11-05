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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

type Props = {
  filterBody: any;
  setFilterBody: any;
  handleApplyFilters?: any;
  handleClearFilter?: any;
};

export default function FilterAction({
  filterBody,
  setFilterBody,
  handleApplyFilters,
  handleClearFilter
}: Props) {
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
    if (handleApplyFilters) {
      handleApplyFilters();
    }
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
                <Label htmlFor="batch_id">Batch ID</Label>
                <Input
                  id="batch_id"
                  value={filterBody.batch_id || ''}
                  onChange={onChangeHandle}
                  placeholder="Enter Batch ID"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="transaction_reference">Transaction ID</Label>
                <Input
                  id="transaction_reference"
                  value={filterBody.transaction_reference || ''}
                  onChange={onChangeHandle}
                  placeholder="Enter Transaction ID"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="transaction_date_start">Transaction Date Start</Label>
                <Input
                  id="transaction_date_start"
                  type="date"
                  value={filterBody.transaction_date_start || ''}
                  onChange={onChangeHandle}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="transaction_date_end">Transaction Date End</Label>
                <Input
                  id="transaction_date_end"
                  type="date"
                  value={filterBody.transaction_date_end || ''}
                  onChange={onChangeHandle}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                onValueChange={(value) => onChangeSelectHandle('payment_method', value)}
                value={filterBody.payment_method || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="NEFT">NEFT</SelectItem>
                  <SelectItem value="RTGS">RTGS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select
                onValueChange={(value) => onChangeSelectHandle('payment_status', value)}
                value={filterBody.payment_status || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="created_at_start">Created At Start</Label>
                <Input
                  id="created_at_start"
                  type="date"
                  value={filterBody.created_at_start || ''}
                  onChange={onChangeHandle}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="created_at_end">Created At End</Label>
                <Input
                  id="created_at_end"
                  type="date"
                  value={filterBody.created_at_end || ''}
                  onChange={onChangeHandle}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <SheetClose asChild>
              <Button type="submit" className="w-full">
                Find Transactions
              </Button>
            </SheetClose>
            {handleClearFilter && (
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
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
