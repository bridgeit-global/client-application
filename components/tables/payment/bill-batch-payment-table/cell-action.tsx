'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { AllBillTableProps } from '@/types/bills-type';
import { RemoveBillFromBatchButton } from '@/components/buttons/remove-bill-from-batch-button';

interface CellActionProps {
  data: AllBillTableProps;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  return <DropdownMenu modal={false}>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem>
        <RemoveBillFromBatchButton row={{ original: data }} />
        Remove from batch
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

};
