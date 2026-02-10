'use client';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { CellAction } from './cell-action';
import { formatRupees } from '@/lib/utils/number-format';
import { ddmmyy } from '@/lib/utils/date-format';
import { ConnectionTableProps } from '@/types/connections-type';
import { BillsProps } from '@/types/bills-type';
import { DueDateCell } from '@/components/table-cells/due-date-cell';
import StatusBadge from '@/components/badges/status-badge';
import { LowBalanceBadge } from '@/components/badges/low-balance-badge';
import { useSiteName } from '@/lib/utils/site';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
import DocumentViewerModalWithPresigned from '@/components/modal/document-viewer-modal-with-presigned';
import { FileText } from 'lucide-react';

const getBillLatestBill = (bills: BillsProps[]): any => {
  return bills.filter((b) => b.is_active == true && b.is_valid == true)[0]
};

/** Get document key and content type from connection_details (pdf_key or html_key) */
function getDocumentKeyAndType(connectionDetails: unknown): { key: string; contentType: 'pdf' | 'html' } | null {
  if (!connectionDetails || typeof connectionDetails !== 'object') return null;
  const details = connectionDetails as Record<string, unknown>;
  if (typeof details.pdf_key === 'string' && details.pdf_key) {
    return { key: details.pdf_key, contentType: 'pdf' };
  }
  if (typeof details.html_key === 'string' && details.html_key) {
    return { key: details.html_key, contentType: 'html' };
  }
  return null;
}

export const subMeterColumns: ColumnDef<ConnectionTableProps>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableResizing: false,
    size: 20
  },
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    id: 'tariff',
    header: 'Tariff',
    cell: ({ row }) => row.original.tariff
  },
  {
    id: 'operator_name',
    header: 'Operator Name',
    cell: ({ row }) => {
      const submeterInfo = row.original.submeter_info as any;
      return submeterInfo?.operator_name || '-';
    }
  },
  {
    id: 'operator_mobile_number',
    header: 'Operator Number',
    cell: ({ row }) => {
      const submeterInfo = row.original.submeter_info as any;
      return submeterInfo?.operator_mobile_number || '-';
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Registration Date',
    cell: ({ row }) => row.original.created_at && ddmmyy(row.original.created_at)
  },
  {
    id: 'actions',
    header: 'Status',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];

export const postpaidColumns: ColumnDef<ConnectionTableProps>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableResizing: false,
    size: 40
  },
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    id: 'connection_date',
    header: 'Connection Date',
    cell: ({ row }) => row.original.connection_date && ddmmyy(row.original.connection_date)
  },
  {
    accessorKey: 'connection_type',
    header: 'Type'
  },
  {
    id: 'security_deposit',
    header: 'Security Deposit',
    cell: ({ row }) => formatRupees(row.original.security_deposit)
  },
  {
    id: 'due_date',
    header: 'Due Date',
    cell: ({ row }) => {
      const latestBill = getBillLatestBill(row.original?.bills);
      const due_date_str = latestBill?.due_date;
      const discount_date_str = latestBill?.discount_date;
      return <DueDateCell discount_date_str={discount_date_str} due_date_str={due_date_str} is_active={latestBill?.is_active} />
    }
  },
  {
    id: 'bill',
    header: 'Bill Status',
    cell: ({ row }) => {
      const latest_bill = getBillLatestBill(row.original.bills);
      if (latest_bill) {
        return (
          <StatusBadge status={latest_bill?.bill_status} />
        );
      }
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Registration Date',
    cell: ({ row }) => row.original.created_at && ddmmyy(row.original.created_at)
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];

export const prepaidColumns: ColumnDef<ConnectionTableProps>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableResizing: false,
    size: 20
  },
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    id: 'biller_board',
    header: 'Biller Board',
    cell: ({ row }) => row.original.biller_list.board_name
  },
  {
    id: 'connection_date',
    header: 'Connection Date',
    cell: ({ row }) => row.original.connection_date && ddmmyy(row.original.connection_date)
  },
  {
    accessorKey: 'connection_type',
    header: 'Type'
  },
  {
    id: 'security_deposit',
    header: 'Security Deposit',
    cell: ({ row }) => formatRupees(row.original.security_deposit)
  },
  {
    id: 'current_balance',
    header: 'Current Balance',
    cell: ({ row }) => <LowBalanceBadge row={{
      original: {
        connections: {
          prepaid_balances: row.original.prepaid_balances,
          prepaid_info: row.original.prepaid_info
        }
      }
    }} />
  },
  {
    id: 'recharge_status',
    header: 'Recharge Status',
    cell: ({ row }) => {
      const recharge_status = row.original?.prepaid_recharge?.length > 0
        ? row.original?.prepaid_recharge.sort((a, b) =>
          new Date(b.recharge_date).getTime() - new Date(a.recharge_date).getTime()
        )[0]?.recharge_status
        : 0;
      if (recharge_status) {
        return <StatusBadge status={recharge_status} />
      }
      return null;
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Registration Date',
    cell: ({ row }) => row.original.created_at && ddmmyy(row.original.created_at)
  },
  {
    id: 'actions',
    header: 'Status',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];

/**
 * Simplified columns for inactive consumers (pre-activation): account number, biller board, site id, document (pdf/html via presigned URL), and registration date.
 */
export const inactiveConsumerColumns: ColumnDef<ConnectionTableProps>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableResizing: false,
    size: 40,
  },
  {
    accessorKey: 'account_number',
    header: 'Account Number',
    cell: ({ row }) => (
      <span className="font-mono text-sm tabular-nums">{row.original.account_number ?? '—'}</span>
    ),
    size: 140,
  },
  {
    id: 'biller_board',
    header: 'Biller Board',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground truncate max-w-[200px] block" title={row.original.biller_list?.board_name}>
        {row.original.biller_list?.board_name ?? '—'}
      </span>
    ),
    size: 220,
  },
  {
    id: 'site_id',
    header: () => useSiteName(),
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.original.site_id ?? '—'}</span>
    ),
    size: 120,
  },
  {
    id: 'document',
    header: 'Document',
    cell: ({ row }) => {
      const doc = getDocumentKeyAndType(row.original.connection_details);
      if (!doc) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return (
        <DocumentViewerModalWithPresigned
          fileKey={doc.key}
          contentType={doc.contentType}
          icon={<FileText className="h-4 w-4" />}
          label={doc.contentType === 'pdf' ? 'View PDF' : 'View HTML'}
        />
      );
    },
    size: 120,
  },
  {
    accessorKey: 'created_at',
    header: 'Registration Date',
    cell: ({ row }) => row.original.created_at && ddmmyy(row.original.created_at)
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <CellAction data={row.original} />
  },
];
