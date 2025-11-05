'use client';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { getLagAging } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ddmmyy } from '@/lib/utils/date-format';
import { ConnectionTableProps } from '@/types/connections-type';
import { useSiteName } from '@/lib/utils/site';
export const columns: ColumnDef<ConnectionTableProps>[] = [
  {
    accessorKey: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => row.original.site_id
  },
  {
    accessorKey: 'account_number',
    header: 'Account Number'
  },
  {
    header: 'Biller Board',
    accessorKey: 'biller_list.board_name',
  },
  {
    header: 'Lagged Days',
    cell: ({ row }) => {
      const agingInDays = getLagAging(row.original);

      // If lag is 0, it means bill already exists for current month
      if (agingInDays <= 0) {
        return (
          <Badge className="w-32 truncate bg-green-500 text-center text-white hover:bg-green-600">
            No Lag
          </Badge>
        );
      }

      if (agingInDays >= 0 && agingInDays <= 5) {
        return (
          <Badge className="w-32 truncate  bg-orange-400  text-center text-white hover:bg-orange-500  ">
            {agingInDays}
          </Badge>
        );
      } else if (agingInDays >= 6 && agingInDays <= 10) {
        return (
          <Badge className="w-32 truncate bg-orange-500  text-center text-white hover:bg-orange-600">
            {agingInDays}
          </Badge>
        );
      } else {
        return (
          <Badge className="w-32 truncate  bg-red-500 text-center text-white hover:bg-red-600 ">
            {agingInDays}
          </Badge>
        );
      }
    }
  },
  {
    header: 'Registration Date',
    cell: ({ row }) => row.original.created_at && ddmmyy(row.original.created_at)
  },
  {
    id: 'actions',
    header: 'Status',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
