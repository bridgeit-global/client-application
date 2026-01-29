'use client';
import { ddmmyy } from '@/lib/utils/date-format';
import { formatRupees } from '@/lib/utils/number-format';
import { ColumnDef } from '@tanstack/react-table';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { BatchHeaderAction, BatchRowAction } from '@/components/batch/batch-row-action';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
import { useSiteName } from '@/lib/utils/site';

export const columns: ColumnDef<PrepaidRechargeTableProps>[] = [
  {
    id: 'select',
    header: ({ table }) => <BatchHeaderAction table={table} itemType="recharge" />,
    cell: ({ row }) => <BatchRowAction row={row} itemType="recharge" />,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 120
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
