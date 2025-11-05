'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ddmmyy } from '@/lib/utils/date-format';
import { formatRupees } from '@/lib/utils/number-format';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import StatusBadge from '@/components/badges/status-badge';
import { useSiteName } from '@/lib/utils/site';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';

export const columns: ColumnDef<PrepaidRechargeTableProps>[] = [

  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    header: 'Recharge Amount',
    cell: ({ row }) => formatRupees(row.original.recharge_amount)
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Recharge Date
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => ddmmyy(row.original.recharge_date),
    accessorKey: 'recharge_date'
  },
  {
    header: 'Recharge Status',
    cell: ({ row }) => <StatusBadge status={row.original.recharge_status} />
  },

];
