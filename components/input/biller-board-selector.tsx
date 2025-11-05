import React from 'react';
import { Label } from '@/components/ui/label';
import MultipleSelector, { Option } from '@/components/ui/multiple-selector';
import { useBillerBoardStore } from '@/lib/store/biller-board-store';

interface BillerBoardSelectorProps {
  label?: string;
  placeholder?: string;
  onChange: (value: string[]) => void;
  defaultValue?: string[];
}

export function BillerBoardSelector({
  label = 'Biller Name',
  placeholder = 'Select Biller Board',
  onChange,
  defaultValue
}: BillerBoardSelectorProps) {
  const billerBoards = useBillerBoardStore((state) => state.billers);

  const handleSelectChange = (selectedOptions: any) => {
    onChange(selectedOptions.map((option: any) => getBillerId(option?.value)));
  };

  const getBillerId = (board_name: string) => {
    return billerBoards.find((b: any) => b?.board_name === board_name)?.alias;
  };

  const defaultList: Option[] = billerBoards.map((e) => ({
    label: e.board_name,
    value: e.board_name,
    state: e.state
  }));

  const handleSearch = (searchTerm: string) => {
    // Always return all biller boards if search is empty
    if (!searchTerm || searchTerm.trim() === '') {
      return billerBoards.map((e) => ({
        label: e.board_name,
        value: e.board_name,
        state: e.state
      }));
    }

    const searchLower = searchTerm.toLowerCase();
    return billerBoards
      .filter((biller) =>
        biller.board_name.toLowerCase().includes(searchLower) ||
        biller.state.toLowerCase().includes(searchLower)
      )
      .map((e) => ({
        label: e.board_name,
        value: e.board_name,
        state: e.state
      }));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="biller_id">{label}</Label>
      <MultipleSelector
        commandProps={{
          label: placeholder
        }}
        groupBy="state"
        maxSelected={5}
        onChange={handleSelectChange}
        defaultOptions={defaultList}
        onSearchSync={handleSearch}
        placeholder={placeholder}
        hideClearAllButton
        hidePlaceholderWhenSelected
        emptyIndicator={<p className="text-center text-sm">No results found</p>}
      />
    </div>
  );
}
