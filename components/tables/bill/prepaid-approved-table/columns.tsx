'use client';
import { ddmmyy } from '@/lib/utils/date-format';
import { formatRupees } from '@/lib/utils/number-format';
import { ColumnDef } from '@tanstack/react-table';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { PrepaidCartHeaderActions, PrepaidCartColumnActions } from '@/components/prepaid-cart-action';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
import { useSiteName } from '@/lib/utils/site';
export const columns: ColumnDef<PrepaidRechargeTableProps>[] = [
  {
    id: 'select',
    header: ({ table }) => <PrepaidCartHeaderActions table={table} />,
    cell: ({ row }) => <PrepaidCartColumnActions row={row} />,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 20
  },
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={{ original: row.original }} />
  },
  {
    header: 'Recharge Amount',
    cell: ({ row }) => formatRupees(row.original.recharge_amount)
  },
  {
    header: 'Recharge Date',
    cell: ({ row }) => ddmmyy(row.original.recharge_date)
  }
];
