'use client';
import { ColumnDef } from '@tanstack/react-table';
import IconButton from '@/components/buttons/icon-button';
import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AllBillTableProps } from '@/types/bills-type';
import { useSiteName } from '@/lib/utils/site';
import { camelCaseToTitleCase } from '@/lib/utils/string-format';
import BillTypeCell from '@/components/table-cells/bill-type-cell';
import { Badge } from '@/components/ui/badge';
import PayTypeBadge from '@/components/badges/pay-type-badge';
import { ddmmyy } from '@/lib/utils/date-format';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
export const columns: ColumnDef<AllBillTableProps>[] = [
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    header: 'Pay Type',
    cell: ({ row }) => <PayTypeBadge paytype={row.original.connections.paytype} />
  },
  {
    header: 'Bill Type',
    cell: ({ row }) => <BillTypeCell row={row} />
  },
  {
    header: 'Reason',
    cell: ({ row }) => {
      const validation = row.original.validation_reason as Record<string, boolean>;
      const billAmount = row.original.bill_amount as number;
      return (
        <div className="space-y-2">
          {billAmount < 0 && (
            <div >
              Negative bill amount
            </div>
          )}
          {validation && Object.keys(validation).map((key) =>
            validation[key] === false ? (
              <div
                key={key}
              >
                {camelCaseToTitleCase(key) + ' discrepancy'}
              </div>
            ) : null
          )}
        </div>
      );
    }
  },
  {
    header: "Valid",
    cell: ({ row }) => {
      const isValid = row.original.is_valid;
      return (
        <Badge variant={isValid ? 'success' : 'destructive'} >
          {isValid ? "Valid Bill" : "Invalid Bill"}
        </Badge>
      );
    }
  },
  {
    header: 'Edit',
    cell: ({ row }) => {
      const router = useRouter();
      return (
        <div className="flex">
          <IconButton
            variant={'ghost'}
            icon={Pencil}
            onClick={() => {
              router.push(`/support/bill/${row.original.id}`);
            }}
            className="hover:bg-gray-100 transition-colors duration-200"
          />
        </div>
      );
    }
  },
  {
    header: 'Bill Date',
    cell: ({ row }) => row.original.bill_date && ddmmyy(row.original.bill_date)
  },
  {
    header: 'Due Date',
    cell: ({ row }) => row.original.due_date && ddmmyy(row.original.due_date)
  }
];
