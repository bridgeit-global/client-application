'use client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';
import IconButton from '@/components/buttons/icon-button';
import { PortalFilterSheet } from '@/components/portal/PortalFilterSheet';

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
    <PortalFilterSheet
      trigger={<IconButton variant="outline" icon={Filter} text="Filter" />}
      primaryLabel="Find Connections"
      onSubmit={handleSubmit}
      onClear={handleClearFilter}
    >
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="parent_id">Parent ID</Label>
          <Input
            id="parent_id"
            value={filterBody.parent_id}
            onChange={onChangeHandle}
            placeholder={`Enter Parent ID`}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="registrationDateStart">
            Registration Date Range
          </Label>
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
    </PortalFilterSheet>
  );
}
