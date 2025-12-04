'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ddmmyy } from '@/lib/utils/date-format';
import { Badge } from '@/components/ui/badge';
import { formatRupees } from '@/lib/utils/number-format';
import { AllBillTableProps } from '@/types/bills-type';
import BillTypeCell from '@/components/table-cells/bill-type-cell';
import PaidBadge from '@/components/badges/paid-badge';
import DocumentViewerModalWithPresigned from '@/components/modal/document-viewer-modal-with-presigned';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { UnitCost } from '@/components/table-cells/unit-cost';
import PayTypeBadge from '@/components/badges/pay-type-badge';
import { DueDateCell } from '@/components/table-cells/due-date-cell';
import StatusBadge from '@/components/badges/status-badge';
import IsActiveBadge from '@/components/badges/is-active-badge';
import { Button } from '@/components/ui/button';
import { useSiteName } from '@/lib/utils/site';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
export const columns: ColumnDef<AllBillTableProps>[] = [

  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    header: `Connection Status`,
    cell: ({ row }) => {
      const connection_status = row.original.connections.is_active;
      return <IsActiveBadge isActive={connection_status} />
    }
  },
  {
    header: 'Pay Type',
    cell: ({ row }) => {
      const paytype = row.original.connections.paytype;
      return <PayTypeBadge paytype={paytype} />
    }
  },
  {
    accessorKey: 'bill_date',
    cell: ({ row }) => row.original.bill_date && ddmmyy(row.original.bill_date),
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Bill Date
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      )
    }
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Due Date
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
    cell: ({ row }) => <DueDateCell discount_date_str={row.original.discount_date} due_date_str={row.original.due_date} />,
    accessorKey: 'due_date'
  },
  {
    header: 'Bill Amount',
    cell: ({ row }) => formatRupees(row.original.bill_amount)
  },
  {
    header: 'Approved Amount',
    cell: ({ row }) => formatRupees(row.original.approved_amount)
  },
  // {
  //   header: 'Cost Per Sqr Meter',
  //   cell: ({ row }) => getCostPerSqrMeter(row.original.bill_amount, Number(row.original.connections.sites.area)),
  // },
  // {
  //   header: 'Consumption Per Sqr Meter',
  //   cell: ({ row }) => getConsumptionPerSqrMeter(row.original.billed_unit, Number(row.original.connections.sites.area)),
  // },
  {
    header: 'Bill Type',
    cell: ({ row }) => <BillTypeCell row={row} />
  },
  {
    header: 'Payment',
    cell: ({ row }) => <PaidBadge row={row.original} />
  },
  {
    header: 'Billed Unit',
    accessorKey: 'billed_unit',
  },
  {
    header: 'Start Date',
    cell: ({ row }) => row.original.start_date && ddmmyy(row.original.start_date)
  },
  {
    header: 'End Date',
    cell: ({ row }) => row.original.end_date && ddmmyy(row.original.end_date)
  },
  {
    header: 'Unit Cost',
    cell: ({ row }) => <UnitCost row={row} />
  },
  // {
  //   header: 'Swap Cost',
  //   cell: ({ row }) => row.original.bill_type.toLowerCase() === "normal" ? row.original.swap_cost && formatRupees(row.original.swap_cost) : ''
  // },
  {
    header: 'Bill Copy',
    cell: ({ row }) => row.original.content ? <DocumentViewerModalWithPresigned
      contentType={row.original.content_type}
      fileKey={row.original.content}
    /> : null
  },
  {
    header: 'Active Status',
    cell: ({ row }) => {
      return (
        <IsActiveBadge isActive={row.original.is_active} />
      );
    }
  },
  {
    header: 'Bill Status',
    cell: ({ row }) => {
      const bill_status = row.original.bill_status;
      return (
        <StatusBadge status={bill_status} />
      );
    }
  },
  {
    header: 'Arrear & Penalty',
    enableResizing: false,
    size: 300,
    cell: ({ row }) => {
      const arrear = Number(row.original.additional_charges?.arrears || 0);
      const penalty = Object.values(row.original.adherence_charges || {})
        .filter((value): value is number => typeof value === 'number')
        .reduce((sum, value) => sum + value, 0);
      return (
        <div className="flex gap-1">
          {arrear !== 0 && (
            <Badge variant={arrear > 0 ? 'destructive' : 'success'}  >
              Arrear: {formatRupees(arrear)}
            </Badge>
          )}
          {Number(penalty) > 0 && (
            <Badge variant="destructive">
              Penalty: {formatRupees(penalty)}
            </Badge>
          )}
        </div>
      );
    }
  },
  {
    header: 'Paid Status',
    cell: ({ row }) => row.original.paid_status ? <Badge variant={'outline'}>{row.original.paid_status}</Badge> : null
  },
  {
    header: 'State',
    cell: ({ row }) => row.original.connections.biller_list.state
  },
  {
    accessorKey: 'created_at',
    header: 'Fetch Date',
    cell: ({ row }) => row.original.created_at && ddmmyy(row.original.created_at)
  },
  {
    header: 'Bill Number',
    cell: ({ row }) => row.original.bill_number
  },
  {
    header: 'Consumer Name',
    cell: ({ row }) => row.original.connections.name
  },
  {
    header: 'Address',
    cell: ({ row }) => row.original.connections.address
  }
];
