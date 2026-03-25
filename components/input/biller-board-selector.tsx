import React, { useEffect, useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import MultipleSelector, { Option } from '@/components/ui/multiple-selector';
import { useBillerBoardStore } from '@/lib/store/biller-board-store';

type BillerBoardSelectorReturnType = 'alias' | 'id';

interface BillerBoardSelectorProps {
  label?: string;
  placeholder?: string;
  onChange: (value: string[]) => void;
  defaultValue?: string[];
  value?: string[];
  returnType?: BillerBoardSelectorReturnType;
  maxSelected?: number;
  hideLabel?: boolean;
}

export function BillerBoardSelector({
  label = 'Biller Name',
  placeholder = 'Select Biller Board',
  onChange,
  defaultValue,
  value,
  returnType = 'alias',
  maxSelected = 5,
  hideLabel = false
}: BillerBoardSelectorProps) {
  const billerBoards = useBillerBoardStore((state) => state.billers);
  const fetchBillers = useBillerBoardStore((state) => state.fetchBillers);

  // Fetch billers if not available
  useEffect(() => {
    if (!billerBoards || billerBoards.length === 0) {
      fetchBillers();
    }
  }, [billerBoards, fetchBillers]);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue ?? []);

  useEffect(() => {
    if (isControlled) return;
    setInternalValue(defaultValue ?? []);
  }, [defaultValue, isControlled]);

  const selectedKeys = isControlled ? value ?? [] : internalValue;

  const getOptionKey = (biller: any) => (returnType === 'id' ? biller.id : biller.alias);

  const defaultList: Option[] = useMemo(
    () =>
      billerBoards.map((e) => ({
        label: e.board_name,
        value: getOptionKey(e),
        state: e.state
      })),
    [billerBoards, returnType]
  );

  const selectedOptions: Option[] = useMemo(() => {
    if (!selectedKeys?.length) return [];
    const selectedSet = new Set(selectedKeys);
    return billerBoards
      .filter((b) => selectedSet.has(getOptionKey(b)))
      .map((b) => ({
        label: b.board_name,
        value: getOptionKey(b),
        state: b.state
      }));
  }, [billerBoards, returnType, selectedKeys]);

  const handleSelectChange = (selected: Option[]) => {
    const next = selected.map((option) => option.value);
    if (!isControlled) {
      setInternalValue(next);
    }
    onChange(next);
  };

  const handleSearch = (searchTerm: string) => {
    // Always return all biller boards if search is empty
    if (!searchTerm || searchTerm.trim() === '') {
      return billerBoards.map((e) => ({
        label: e.board_name,
        value: getOptionKey(e),
        state: e.state
      }));
    }

    const searchLower = searchTerm.toLowerCase();
    return billerBoards
      .filter(
        (biller) =>
          biller.board_name.toLowerCase().includes(searchLower) ||
          biller.state.toLowerCase().includes(searchLower)
      )
      .map((e) => ({
        label: e.board_name,
        value: getOptionKey(e),
        state: e.state
      }));
  };

  return (
    <div className="space-y-2">
      {!hideLabel ? <Label htmlFor="biller_id">{label}</Label> : null}
      <MultipleSelector
        commandProps={{
          label: placeholder
        }}
        groupBy="state"
        maxSelected={maxSelected}
        onChange={handleSelectChange}
        defaultOptions={defaultList}
        value={selectedOptions}
        onSearchSync={handleSearch}
        placeholder={placeholder}
        hideClearAllButton
        hidePlaceholderWhenSelected
        emptyIndicator={<p className="text-center text-sm">No results found</p>}
      />
    </div>
  );
}
