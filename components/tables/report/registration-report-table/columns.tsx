'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ddmmyy } from '@/lib/utils/date-format';
import { ConnectionTableProps } from '@/types/connections-type';
import IsActiveBadge from '@/components/badges/is-active-badge';
import { useSiteName } from '@/lib/utils/site';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
export const columns: ColumnDef<ConnectionTableProps>[] = [
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    header: 'State',
    accessorKey: 'biller_list.state',
  },
  {
    accessorKey: 'created_at',
    header: 'Registration Date',
    cell: ({ row }) => row.original.created_at && ddmmyy(row.original.created_at)
  },
  {
    header: 'Status',
    cell: ({ row }) => {
      return <IsActiveBadge isActive={row.original.is_active} />
    }
  }
];
