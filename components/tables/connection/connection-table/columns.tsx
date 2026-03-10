'use client';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { CopyIcon, EyeIcon } from 'lucide-react';
import { CellAction } from './cell-action';
import { formatRupees } from '@/lib/utils/number-format';
import { ddmmyy } from '@/lib/utils/date-format';
import { ConnectionTableProps } from '@/types/connections-type';
import StatusBadge from '@/components/badges/status-badge';
import { LowBalanceBadge } from '@/components/badges/low-balance-badge';
import { useSiteName } from '@/lib/utils/site';
import DocumentViewerModalWithPresigned from '@/components/modal/document-viewer-modal-with-presigned';
import { getStorageSourceFromPaytype } from '@/lib/utils/presigned-url-client';
import { FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    accessorKey: 'account_number',
    header: 'Account Number',
    cell: ({ row }) => {
      const router = useRouter();
      const account_number = row.original.account_number ?? '—';
      const handleCopy = () => navigator.clipboard.writeText(String(row.original.account_number ?? ''));
      const goToProfile = () => row.original.is_active && router.push(`/portal/profile?id=${row.original.id}`);
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-sm tabular-nums"
              disabled={!row.original.is_active}
              onClick={goToProfile}
            >
              {account_number}
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={handleCopy}>
              <CopyIcon className="w-4 h-4 mr-2" /> Copy
            </ContextMenuItem>
            <ContextMenuItem onSelect={goToProfile}>
              <EyeIcon className="w-4 h-4 mr-2" /> View Connection
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    },
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
    cell: ({ row }) => {
      const router = useRouter();
      const site_name = useSiteName();
      const site_id = row.original.site_id ?? '—';
      const handleCopy = () => navigator.clipboard.writeText(String(row.original.site_id ?? ''));
      const goToSite = () => row.original.is_active && router.push(`/portal/site-profile?id=${row.original.site_id}`);
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-sm font-medium"
              disabled={!row.original.is_active}
              onClick={goToSite}
            >
              {site_id}
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={handleCopy}>
              <CopyIcon className="w-4 h-4 mr-2" /> Copy
            </ContextMenuItem>
            <ContextMenuItem onSelect={goToSite}>
              <EyeIcon className="w-4 h-4 mr-2" /> View {site_name}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    },
    size: 120,
  },
  {
    id: 'tariff',
    header: 'Tariff',
    cell: ({ row }) => row.original.tariff ?? '—'
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
    accessorKey: 'account_number',
    header: 'Account Number',
    cell: ({ row }) => {
      const router = useRouter();
      const account_number = row.original.account_number ?? '—';
      const handleCopy = () => navigator.clipboard.writeText(String(row.original.account_number ?? ''));
      const goToProfile = () => row.original.is_active && router.push(`/portal/profile?id=${row.original.id}`);
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-sm tabular-nums"
              disabled={!row.original.is_active}
              onClick={goToProfile}
            >
              {account_number}
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={handleCopy}>
              <CopyIcon className="w-4 h-4 mr-2" /> Copy
            </ContextMenuItem>
            <ContextMenuItem onSelect={goToProfile}>
              <EyeIcon className="w-4 h-4 mr-2" /> View Connection
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    },
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
    cell: ({ row }) => {
      const router = useRouter();
      const site_name = useSiteName();
      const site_id = row.original.site_id ?? '—';
      const handleCopy = () => navigator.clipboard.writeText(String(row.original.site_id ?? ''));
      const goToSite = () => row.original.is_active && router.push(`/portal/site-profile?id=${row.original.site_id}`);
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-sm font-medium"
              disabled={!row.original.is_active}
              onClick={goToSite}
            >
              {site_id}
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={handleCopy}>
              <CopyIcon className="w-4 h-4 mr-2" /> Copy
            </ContextMenuItem>
            <ContextMenuItem onSelect={goToSite}>
              <EyeIcon className="w-4 h-4 mr-2" /> View {site_name}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    },
    size: 120,
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
    header: 'Actions',
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
    cell: ({ row }) => {
      const router = useRouter();
      const account_number = row.original.account_number ?? '—';
      const handleCopy = () => navigator.clipboard.writeText(String(row.original.account_number ?? ''));
      const goToProfile = () => row.original.is_active && router.push(`/portal/profile?id=${row.original.id}`);
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-sm tabular-nums"
              disabled={!row.original.is_active}
              onClick={goToProfile}
            >
              {account_number}
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={handleCopy}>
              <CopyIcon className="w-4 h-4 mr-2" /> Copy
            </ContextMenuItem>
            <ContextMenuItem onSelect={goToProfile}>
              <EyeIcon className="w-4 h-4 mr-2" /> View Connection
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    },
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
    cell: ({ row }) => {
      const router = useRouter();
      const site_name = useSiteName();
      const site_id = row.original.site_id ?? '—';
      const handleCopy = () => navigator.clipboard.writeText(String(row.original.site_id ?? ''));
      const goToSite = () => row.original.is_active && router.push(`/portal/site-profile?id=${row.original.site_id}`);
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-sm font-medium"
              disabled={!row.original.is_active}
              onClick={goToSite}
            >
              {site_id}
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={handleCopy}>
              <CopyIcon className="w-4 h-4 mr-2" /> Copy
            </ContextMenuItem>
            <ContextMenuItem onSelect={goToSite}>
              <EyeIcon className="w-4 h-4 mr-2" /> View {site_name}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    },
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
          storageSource={getStorageSourceFromPaytype(row.original.paytype)}
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
