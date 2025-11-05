'use client';
import { ColumnDef } from '@tanstack/react-table';
import {
  getPrepaidBalance,
  prepaidBalanceLagStatus
} from '@/lib/utils';
import { formatRupees } from '@/lib/utils/number-format';
import { Badge } from '@/components/ui/badge';
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
    cell: ({ row }) => row.original.biller_list.board_name
  },
  {
    accessorKey: 'security_deposit',
    header: 'Security Deposit',
    cell: ({ row }) => formatRupees(row.original.security_deposit)
  },
  {
    header: 'Balance Amount',
    cell: ({ row }) => {
      if (row.original?.prepaid_balances.length) {
        const latestPrepaid = getPrepaidBalance(row.original?.prepaid_balances);
        return <div>{formatRupees(latestPrepaid.balance_amount)}</div>;
      }
    }
  },
  {
    header: 'Lag Status',
    cell: ({ row }) => {
      const lag_status = prepaidBalanceLagStatus(row.original.prepaid_balances);
      return (
        <Badge
          className={`bg-${lag_status.color}-500  text-center text-white hover:bg-${lag_status.color}-600`}
        >
          {lag_status.title}
        </Badge>
      );
    }
  }
];
