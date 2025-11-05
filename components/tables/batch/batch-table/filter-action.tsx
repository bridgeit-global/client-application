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
  const onChangeHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterBody((prev: any) => ({
      ...prev,
      [e.target.id]: e.target.value
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
              <Label htmlFor="batch_id">Batch ID</Label>
              <Input
                id="batch_id"
                value={filterBody.batch_id}
                onChange={onChangeHandle}
                placeholder="Enter Batch ID"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="created-at-start">Batch Creation Range</Label>
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
                Find Batch
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
