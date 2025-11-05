'use client';

import { useBatchCartStore } from '@/lib/store/batch-cart-store';
import { Checkbox } from '@/components/ui/checkbox';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { isDisabled } from '@/lib/utils';
type RowType = {
  original: PrepaidRechargeTableProps;
};

export function PrepaidCartHeaderActions({ table }: any) {
  const { addAllItem, removeAllItems, items } = useBatchCartStore();
  const selectableRows = table.getFilteredRowModel().rows;

  const isAllSelectableRowsSelected = selectableRows.every((row: RowType) =>
    items.some((item) => item.id === row.original.id)
  );

  const handleSelectAll = (checked: boolean) => {
    selectableRows.forEach((row: any) => row.toggleSelected(checked));
    if (checked) {
      const itemsToAdd = selectableRows.map((row: RowType) => row.original);
      addAllItem(itemsToAdd);
    } else {
      const itemIdsToRemove = selectableRows.map(
        (row: RowType) => row.original.id
      );
      removeAllItems(itemIdsToRemove);
    }
  };

  return (
    <Checkbox
      checked={isAllSelectableRowsSelected}
      onCheckedChange={handleSelectAll}
      aria-label="Select all"
    />
  );
}

export function PrepaidCartColumnActions({ row }: any) {
  const { addItem, removeItem, items } = useBatchCartStore();

  const hasBatchId = isDisabled(row.original);
  const isSelected = items.some((item) => item.id === row.original.id);

  const handleRowSelection = (checked: boolean) => {
    row.toggleSelected(checked);
    if (checked) {
      addItem(row.original);
    } else {
      removeItem(row.original.id);
    }
  };

  return (
    <Checkbox
      checked={isSelected}
      onCheckedChange={handleRowSelection}
      aria-label="Select row"
      disabled={hasBatchId}
    />
  );
}
