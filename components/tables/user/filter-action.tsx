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
            <div className="space-y-1.5">
              <Label>Status Type</Label>
              <Select
                onValueChange={(value) => onChangeSelectHandle('status', value)}
                value={filterBody.status || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                  <SelectItem value="1">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                <Label htmlFor="name">{site_name} Name</Label>
                <Input
                  id="name"
                  value={filterBody.name}
                  onChange={onChangeHandle}
                  placeholder={`Enter ${site_name} Name`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="registrationDateStart">Registration Date Range</Label>
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
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <SheetClose asChild>
              <Button type="submit" className="w-full">
                Find {site_name}
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
