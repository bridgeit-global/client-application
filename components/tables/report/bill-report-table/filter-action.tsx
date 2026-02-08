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
  SelectValue
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { StationTypeSelector } from '@/components/input/station-type-selector';
import MultipleSelector, { Option } from '@/components/ui/multiple-selector';
import { SURCHARGE_OPTIONS } from '@/constants/surcharge-options';

import { BILL_STATUS_LIST } from '@/constants/bill';
import { useSiteName } from '@/lib/utils/site';
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
}: Props) {
  const site_name = useSiteName();
  // get user station type
  const supabase = createClient();
  const getUser = async () => {
    if (filterBody instanceof Object && "type" in filterBody) {
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.site_type ?? user?.user_metadata?.station_type) {
      setFilterBody({ ...filterBody, type: (user?.user_metadata?.site_type ?? user?.user_metadata?.station_type) } as any);
    }
  }
  useEffect(() => {
    getUser();
  }, []);
  const onChangeHandle = (e: any) => {
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
      <SheetContent className="w-full sm:w-[400px] flex flex-col" side="right">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto pr-6">

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
              <div className="space-y-1.5">
                <Label htmlFor="site_type">{site_name} Type</Label>
                <StationTypeSelector
                  value={Array.isArray(filterBody?.type) ? filterBody.type : filterBody?.type?.split(',') || []}
                  onChange={(types) => onChangeSelectHandle("type", types)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="billDateStart">Bill Date Range</Label>
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
                <Label htmlFor="dueDateStart">Due Date Range</Label>
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
                  <Label>Connection Status</Label>
                  <Select
                    onValueChange={(value) => onChangeSelectHandle('connection_status', value)}
                    value={filterBody.connection_status || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Connection Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Pay Type</Label>
                  <Select
                    onValueChange={(value) => onChangeSelectHandle('pay_type', value)}
                    value={filterBody.pay_type || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Pay Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="0">Prepaid</SelectItem>
                      <SelectItem value="1">Postpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Bill Type</Label>
                  <Select
                    onValueChange={(value) => onChangeSelectHandle('bill_type', value)}
                    value={filterBody.bill_type || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Bill Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Abnormal">Abnormal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Active Status</Label>
                  <Select
                    onValueChange={(value) => onChangeSelectHandle('is_active', value)}
                    value={filterBody.is_active || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Active Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Bill Status</Label>
                  <Select
                    onValueChange={(value) => onChangeSelectHandle('bill_status', value)}
                    value={filterBody.bill_status || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {BILL_STATUS_LIST.map((status) => (
                        <SelectItem key={status.value} value={status.value}>{status.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="true">Positive Arrear</SelectItem>
                      <SelectItem value="false">Negative Arrear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
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
              <div className="space-y-1.5">
                <Label htmlFor="is_arrear">Bill Date Vs Fetch Date</Label>
                <Select
                  onValueChange={(value) => onChangeSelectHandle('bill_date_vs_fetch_date', value)}
                  value={filterBody.bill_date_vs_fetch_date}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Bill Date Vs Fetch Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="0-3">0-3</SelectItem>
                    <SelectItem value="4-7">4-7</SelectItem>
                    <SelectItem value="7+">7+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bill_date_vs_due_date">Bill Date Vs Due Date</Label>
                <Select
                  onValueChange={(value) => onChangeSelectHandle('bill_date_vs_due_date', value)}
                  value={filterBody.bill_date_vs_due_date}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Bill Date Vs Due Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="0-3">0-3</SelectItem>
                    <SelectItem value="4-7">4-7</SelectItem>
                    <SelectItem value="7+">7+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="is_overload">Overload Connection</Label>
                <Select
                  onValueChange={(value) => onChangeSelectHandle('is_overload', value)}
                  value={filterBody.is_overload}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Overload" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="is_rebate_eligible">Rebate Eligible</Label>
                <Select
                  onValueChange={(value) => onChangeSelectHandle('is_rebate_eligible', value)}
                  value={filterBody.is_rebate_eligible}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Rebate Eligible" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paid_status">Paid Status</Label>
                <Select
                  value={filterBody.paid_status}
                  onValueChange={(value) => onChangeSelectHandle('paid_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Paid Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="on_time">On Time Payment</SelectItem>
                    <SelectItem value="late">Late Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bill_fetch_end">Fetch Date Range</Label>
                <div className="flex space-x-2">
                  <Input
                    id="bill_fetch_start"
                    type="date"
                    value={filterBody.bill_fetch_start}
                    onChange={onChangeHandle}
                  />
                  <Input
                    id="bill_fetch_end"
                    type="date"
                    value={filterBody.bill_fetch_end}
                    onChange={onChangeHandle}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4 sticky bottom-0 py-4 bg-background border-t">
              <SheetClose asChild>
                <Button type="submit" className="w-full">
                  Find Bills
                </Button>
              </SheetClose>
            </div>
          </div>
        </form >
      </SheetContent >
    </Sheet >
  );
}
