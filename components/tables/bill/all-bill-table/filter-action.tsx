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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { StationTypeSelector } from '@/components/input/station-type-selector';
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
  handleClearFilter
}: Props) {
  const site_name = useSiteName()
  // get user station type
  const supabase = createClient();
  const getUser = async () => {
    if (filterBody.type) {
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Pay Type</Label>
                <Select
                  onValueChange={(value) => onChangeSelectHandle('paytype', value)}
                  value={filterBody.paytype || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="0">Prepaid</SelectItem>
                    <SelectItem value="1">Postpaid</SelectItem>
                    <SelectItem value="-1">Submeter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Bill Status</Label>
                <Select
                  onValueChange={(value) => onChangeSelectHandle('is_active', value)}
                  value={filterBody.is_active || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Validation</Label>
                <Select
                  onValueChange={(value) => onChangeSelectHandle('is_valid', value)}
                  value={filterBody.is_valid || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="true">Valid</SelectItem>
                    <SelectItem value="false">Invalid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <SheetClose asChild>
              <Button type="submit" className="w-full">
                Find Bills
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
