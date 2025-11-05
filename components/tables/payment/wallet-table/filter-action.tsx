'use client';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

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
            <div className="space-y-1.5">
              <Label htmlFor="transaction_type">Transaction Type</Label>
              <Select
                onValueChange={(value) => onChangeSelectHandle('transaction_type', value)}
                value={filterBody.transaction_type || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="credit">Paid</SelectItem>
                  <SelectItem value="debit">Biller Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batch_id">Batch ID</Label>
              <Input
                id="batch_id"
                value={filterBody.batch_id || ""}
                onChange={onChangeHandle}
                placeholder="Enter Batch ID"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transaction_id">Ref ID</Label>
              <Input
                id="transaction_id"
                value={filterBody.transaction_id || ""}
                onChange={onChangeHandle}
                placeholder="Enter Ref ID"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount_min">Min Amount</Label>
                <Input
                  id="amount_min"
                  type="number"
                  value={filterBody.amount_min || ""}
                  onChange={onChangeHandle}
                  placeholder="Min Amount"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount_max">Max Amount</Label>
                <Input
                  id="amount_max"
                  type="number"
                  value={filterBody.amount_max || ""}
                  onChange={onChangeHandle}
                  placeholder="Max Amount"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date_from">From Date</Label>
                <Input
                  id="date_from"
                  type="date"
                  value={filterBody.date_from || ""}
                  onChange={onChangeHandle}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date_to">To Date</Label>
                <Input
                  id="date_to"
                  type="date"
                  value={filterBody.date_to || ""}
                  onChange={onChangeHandle}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={filterBody.remarks || ""}
                onChange={onChangeHandle}
                placeholder="Search in remarks"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <SheetClose asChild>
              <Button type="submit" className="w-full">
                Apply Filters
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
